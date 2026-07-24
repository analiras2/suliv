import { Injectable } from '@nestjs/common';
import { Prisma, RecipeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeSummaryDto } from '../recipes/recipe-summary.dto';

export const FAVORITE_ADD_ACTION_TYPE = 'favorite_add';
export const FAVORITE_REMOVE_ACTION_TYPE = 'favorite_remove';

const FAVORITES_PAGE_SIZE = 20;

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), 'utf8').toString('base64');
}

function decodeCursor(cursor: string): number {
  const offset = Number(Buffer.from(cursor, 'base64').toString('utf8'));
  return Number.isInteger(offset) && offset >= 0 ? offset : 0;
}

function todayUtc(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export interface PaginatedFavorites {
  items: RecipeSummaryDto[];
  nextCursor: string | null;
}

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async add(
    userId: string,
    recipeId: string,
    idempotencyKey?: string,
  ): Promise<void> {
    if (idempotencyKey) {
      const alreadyApplied = await this.prisma.syncOperation.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey } },
      });
      if (alreadyApplied) {
        return;
      }
    }

    await this.prisma.$transaction([
      ...this.buildAddOperations(userId, recipeId),
      ...(idempotencyKey
        ? [
            this.prisma.syncOperation.create({
              data: {
                userId,
                idempotencyKey,
                actionType: FAVORITE_ADD_ACTION_TYPE,
              },
            }),
          ]
        : []),
    ]);
  }

  async remove(userId: string, recipeId: string): Promise<void> {
    await this.prisma.favorite.deleteMany({ where: { userId, recipeId } });
  }

  buildAddOperations(
    userId: string,
    recipeId: string,
  ): Prisma.PrismaPromise<unknown>[] {
    const date = todayUtc();
    return [
      this.prisma.favorite.upsert({
        where: { userId_recipeId: { userId, recipeId } },
        update: {},
        create: { userId, recipeId },
      }),
      this.prisma.recipeDailyStats.upsert({
        where: { recipeId_date: { recipeId, date } },
        update: { favoritesAdded: { increment: 1 } },
        create: { recipeId, date, favoritesAdded: 1 },
      }),
    ];
  }

  buildRemoveOperations(
    userId: string,
    recipeId: string,
  ): Prisma.PrismaPromise<unknown>[] {
    return [this.prisma.favorite.deleteMany({ where: { userId, recipeId } })];
  }

  async list(userId: string, cursor?: string): Promise<PaginatedFavorites> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (favorites.length === 0) {
      return { items: [], nextCursor: null };
    }

    const recipes = await this.prisma.recipe.findMany({
      where: {
        id: { in: favorites.map((favorite) => favorite.recipeId) },
        status: { not: RecipeStatus.removida },
      },
      include: { category: true },
    });
    const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
    const ordered = favorites
      .map((favorite) => recipeById.get(favorite.recipeId))
      .filter((recipe): recipe is (typeof recipes)[number] => Boolean(recipe));

    const offset = cursor ? decodeCursor(cursor) : 0;
    const page = ordered.slice(offset, offset + FAVORITES_PAGE_SIZE);
    const nextOffset = offset + page.length;

    return {
      items: page.map((recipe) => RecipeSummaryDto.fromRecipe(recipe)),
      nextCursor: nextOffset < ordered.length ? encodeCursor(nextOffset) : null,
    };
  }
}
