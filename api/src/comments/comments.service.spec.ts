import {
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommentRating } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommentsService } from './comments.service';

function commentRatingFixture(
  overrides: Partial<CommentRating> = {},
): CommentRating {
  return {
    id: 'comment-1',
    recipeId: 'recipe-1',
    userId: 'user-1',
    rating: 4,
    commentText: null,
    status: 'visible',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('CommentsService', () => {
  const upsertCommentRating = jest.fn();
  const countCommentRating = jest.fn();
  const findManyCommentRating = jest.fn();
  const findUniqueCommentRating = jest.fn();
  const deleteCommentRating = jest.fn();
  const findManyUser = jest.fn();
  const prisma = {
    commentRating: {
      upsert: upsertCommentRating,
      count: countCommentRating,
      findMany: findManyCommentRating,
      findUnique: findUniqueCommentRating,
      delete: deleteCommentRating,
    },
    user: { findMany: findManyUser },
  };
  let service: CommentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    countCommentRating.mockResolvedValue(0);
    findManyUser.mockResolvedValue([]);
    service = new CommentsService(prisma as unknown as PrismaService);
  });

  describe('upsert', () => {
    it('UT-001 creates a new row with the submitted rating and comment text', async () => {
      const created = commentRatingFixture({
        rating: 4,
        commentText: 'ótima receita',
      });
      upsertCommentRating.mockResolvedValue(created);
      findManyUser.mockResolvedValue([
        { id: 'user-1', name: 'Ana', username: 'ana_1' },
      ]);

      const result = await service.upsert('recipe-1', 'user-1', {
        rating: 4,
        commentText: 'ótima receita',
      });

      expect(result.rating).toBe(4);
      expect(result.commentText).toBe('ótima receita');
      expect(result.userName).toBe('Ana');
      expect(upsertCommentRating).toHaveBeenCalledWith({
        where: { recipeId_userId: { recipeId: 'recipe-1', userId: 'user-1' } },
        update: { rating: 4, commentText: 'ótima receita' },
        create: {
          recipeId: 'recipe-1',
          userId: 'user-1',
          rating: 4,
          commentText: 'ótima receita',
        },
      });
    });

    it('UT-002 creates a row with comment_text: null when no comment text is given', async () => {
      const created = commentRatingFixture({ rating: 5, commentText: null });
      upsertCommentRating.mockResolvedValue(created);

      const result = await service.upsert('recipe-1', 'user-1', {
        rating: 5,
      });

      expect(result.commentText).toBeNull();
      expect(upsertCommentRating).toHaveBeenCalledWith(
        expect.objectContaining({
          create: {
            recipeId: 'recipe-1',
            userId: 'user-1',
            rating: 5,
            commentText: null,
          },
        }),
      );
    });

    it('UT-003 rejects a rating outside 1-5 with a 422', async () => {
      await expect(
        service.upsert('recipe-1', 'user-1', { rating: 6 }),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(upsertCommentRating).not.toHaveBeenCalled();
    });

    it('UT-004 a second submission updates the existing row instead of creating a duplicate', async () => {
      const updated = commentRatingFixture({
        rating: 2,
        commentText: 'mudei de ideia',
      });
      upsertCommentRating.mockResolvedValue(updated);

      const result = await service.upsert('recipe-1', 'user-1', {
        rating: 2,
        commentText: 'mudei de ideia',
      });

      expect(result.rating).toBe(2);
      expect(upsertCommentRating).toHaveBeenCalledTimes(1);
      expect(upsertCommentRating).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { rating: 2, commentText: 'mudei de ideia' },
        }),
      );
    });

    it('UT-007 rejects with 429 on the 21st comment/rating action in the same day', async () => {
      countCommentRating.mockResolvedValue(20);

      await expect(
        service.upsert('recipe-21', 'user-1', { rating: 3 }),
      ).rejects.toThrow(HttpException);
      expect(upsertCommentRating).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('UT-005 deletes the row when the requester is the review author', async () => {
      findUniqueCommentRating.mockResolvedValue(
        commentRatingFixture({ userId: 'user-1' }),
      );

      await service.remove('comment-1', 'user-1');

      expect(deleteCommentRating).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      });
    });

    it('UT-006 throws 403 and leaves the row intact when the requester is not the author', async () => {
      findUniqueCommentRating.mockResolvedValue(
        commentRatingFixture({ userId: 'user-1' }),
      );

      await expect(service.remove('comment-1', 'someone-else')).rejects.toThrow(
        ForbiddenException,
      );
      expect(deleteCommentRating).not.toHaveBeenCalled();
    });

    it('throws 404 when the comment does not exist', async () => {
      findUniqueCommentRating.mockResolvedValue(null);

      await expect(service.remove('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('list', () => {
    it('UT-008 excludes hidden rows, only visible status is queried', async () => {
      findManyCommentRating.mockResolvedValue([
        commentRatingFixture({ id: 'comment-visible', status: 'visible' }),
      ]);

      const result = await service.list('recipe-1');

      expect(result.items).toHaveLength(1);
      expect(findManyCommentRating).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recipeId: 'recipe-1', status: 'visible' },
        }),
      );
    });
  });
});
