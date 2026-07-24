import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommentRatingDto } from './comment-rating.dto';

const COMMENTS_PAGE_SIZE = 20;
const MAX_COMMENTS_PER_DAY = 20;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const MIN_RATING = 1;
const MAX_RATING = 5;

export interface PaginatedComments {
  items: CommentRatingDto[];
  nextCursor: string | null;
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), 'utf8').toString('base64');
}

function decodeCursor(cursor: string): number {
  const offset = Number(Buffer.from(cursor, 'base64').toString('utf8'));
  return Number.isInteger(offset) && offset >= 0 ? offset : 0;
}

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(recipeId: string, cursor?: string): Promise<PaginatedComments> {
    const offset = cursor ? decodeCursor(cursor) : 0;
    const rows = await this.prisma.commentRating.findMany({
      where: { recipeId, status: CommentStatus.visible },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: COMMENTS_PAGE_SIZE + 1,
    });

    const hasMore = rows.length > COMMENTS_PAGE_SIZE;
    const page = hasMore ? rows.slice(0, COMMENTS_PAGE_SIZE) : rows;
    const userNameById = await this.getUserNamesById(
      page.map((row) => row.userId),
    );

    return {
      items: page.map((row) =>
        CommentRatingDto.fromRow(
          row,
          userNameById.get(row.userId) ?? row.userId,
        ),
      ),
      nextCursor: hasMore ? encodeCursor(offset + page.length) : null,
    };
  }

  async upsert(
    recipeId: string,
    userId: string,
    input: { rating: number; commentText?: string },
  ): Promise<CommentRatingDto> {
    if (
      !Number.isInteger(input.rating) ||
      input.rating < MIN_RATING ||
      input.rating > MAX_RATING
    ) {
      throw new UnprocessableEntityException(
        'rating must be an integer between 1 and 5',
      );
    }
    await this.enforceRateLimit(recipeId, userId);

    const row = await this.prisma.commentRating.upsert({
      where: { recipeId_userId: { recipeId, userId } },
      update: { rating: input.rating, commentText: input.commentText ?? null },
      create: {
        recipeId,
        userId,
        rating: input.rating,
        commentText: input.commentText ?? null,
      },
    });
    const userNameById = await this.getUserNamesById([userId]);

    return CommentRatingDto.fromRow(row, userNameById.get(userId) ?? userId);
  }

  async remove(commentId: string, userId: string): Promise<void> {
    const row = await this.prisma.commentRating.findUnique({
      where: { id: commentId },
    });
    if (!row) {
      throw new NotFoundException('Comment not found');
    }
    if (row.userId !== userId) {
      throw new ForbiddenException('You do not own this comment');
    }

    await this.prisma.commentRating.delete({ where: { id: commentId } });
  }

  private async getUserNamesById(
    userIds: string[],
  ): Promise<Map<string, string>> {
    if (userIds.length === 0) {
      return new Map();
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, username: true },
    });
    return new Map(users.map((user) => [user.id, user.name ?? user.username]));
  }

  private async enforceRateLimit(
    recipeId: string,
    userId: string,
  ): Promise<void> {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    // Re-submitting an already-rated recipe (edit-in-place, §3.11) must never
    // count as a new action, so the target recipe is excluded from the
    // count — only distinct actions taken in the last 24h count toward the
    // §19.5.8 limit.
    const recentActionsCount = await this.prisma.commentRating.count({
      where: {
        userId,
        recipeId: { not: recipeId },
        updatedAt: { gte: windowStart },
      },
    });

    if (recentActionsCount >= MAX_COMMENTS_PER_DAY) {
      this.logger.warn(
        `Rate limit exceeded for user ${userId} on comments/ratings (${recentActionsCount} actions in the last 24h)`,
      );
      throw new HttpException(
        'Rate limit exceeded: maximum 20 comments/ratings per day',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
