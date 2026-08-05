import { Injectable, NotFoundException } from '@nestjs/common';
import { AdjustmentReason, Prisma, RecipeStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RecipeSummaryDto } from '../../recipes/recipe-summary.dto';
import { NotificationsService } from '../../notifications/notifications.service';
import { AuditLogService } from '../audit-log.service';
import { AdminRecipeDetailDto } from './dto';

const PENDING_PAGE_SIZE = 20;

export interface PaginatedAdminRecipes {
  items: RecipeSummaryDto[];
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
export class AdminRecipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listPending(
    status?: RecipeStatus,
    cursor?: string,
  ): Promise<PaginatedAdminRecipes> {
    const offset = cursor ? decodeCursor(cursor) : 0;
    const where: Prisma.RecipeWhereInput = {
      status: status ?? RecipeStatus.em_analise,
    };

    const recipes = await this.prisma.recipe.findMany({
      where,
      include: { category: true },
      orderBy: { submittedAt: 'asc' },
      skip: offset,
      take: PENDING_PAGE_SIZE + 1,
    });

    const hasMore = recipes.length > PENDING_PAGE_SIZE;
    const page = hasMore ? recipes.slice(0, PENDING_PAGE_SIZE) : recipes;

    return {
      items: page.map((recipe) => RecipeSummaryDto.fromRecipe(recipe)),
      nextCursor: hasMore ? encodeCursor(offset + page.length) : null,
    };
  }

  // Bypasses the public GET /recipes/:slug visibility rule entirely (ADR-004):
  // an admin can review a recipe in any status, gated only by AdminAuthGuard.
  async getForReview(recipeId: string): Promise<AdminRecipeDetailDto> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { category: true, ingredients: true, steps: true },
    });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const aggregate = await this.getRatingAggregate(recipe.id);
    return AdminRecipeDetailDto.fromRecipe(recipe, aggregate);
  }

  async approve(adminId: string, recipeId: string): Promise<void> {
    const recipe = await this.updateRecipeOrThrow(recipeId, {
      status: RecipeStatus.aprovada,
      approvedAt: new Date(),
      adjustmentReason: null,
      adjustmentNote: null,
    });

    this.auditLogService.log({
      adminId,
      action: 'approve',
      targetId: recipeId,
    });

    // Best-effort: the status transition above already committed regardless
    // of this call's outcome (ADR-003 in the Notifications module's own
    // TechSpec — send() never throws, but this call site never trusts that).
    if (recipe.authorId) {
      await this.notificationsService
        .send(recipe.authorId, 'recipe_approved', {
          recipeTitle: recipe.title,
        })
        .catch(() => undefined);
    }
  }

  async requestAdjustment(
    adminId: string,
    recipeId: string,
    reason: AdjustmentReason,
    note?: string,
  ): Promise<void> {
    const recipe = await this.updateRecipeOrThrow(recipeId, {
      status: RecipeStatus.precisa_de_ajustes,
      adjustmentReason: reason,
      adjustmentNote: note ?? null,
    });

    this.auditLogService.log({
      adminId,
      action: 'request-adjustment',
      targetId: recipeId,
    });

    if (recipe.authorId) {
      await this.notificationsService
        .send(recipe.authorId, 'recipe_needs_adjustment', {
          recipeTitle: recipe.title,
          adjustmentReason: reason,
        })
        .catch(() => undefined);
    }
  }

  private async updateRecipeOrThrow(
    recipeId: string,
    data: Prisma.RecipeUpdateInput,
  ): Promise<{ id: string; authorId: string | null; title: string }> {
    try {
      return await this.prisma.recipe.update({
        where: { id: recipeId },
        data,
        select: { id: true, authorId: true, title: true },
      });
    } catch (error: unknown) {
      if (this.isRecordNotFound(error)) {
        throw new NotFoundException('Recipe not found');
      }
      throw error;
    }
  }

  private isRecordNotFound(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }

  private async getRatingAggregate(
    recipeId: string,
  ): Promise<{ averageRating: number | null; ratingCount: number }> {
    const result = await this.prisma.commentRating.aggregate({
      where: { recipeId, status: 'visible' },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: result._count.rating === 0 ? null : result._avg.rating,
      ratingCount: result._count.rating,
    };
  }
}
