import { BadRequestException, Injectable } from '@nestjs/common';
import {
  FAVORITE_ADD_ACTION_TYPE,
  FAVORITE_REMOVE_ACTION_TYPE,
  FavoritesService,
} from '../favorites/favorites.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  DRAFT_UPSERT_ACTION_TYPE,
  RecipesService,
} from '../recipes/recipes.service';

const RECOGNIZED_ACTION_TYPES = new Set([
  FAVORITE_ADD_ACTION_TYPE,
  FAVORITE_REMOVE_ACTION_TYPE,
  DRAFT_UPSERT_ACTION_TYPE,
]);

export interface SyncAction {
  type: string;
  payload: unknown;
  idempotencyKey: string;
}

export interface SyncApplyResult {
  appliedCount: number;
  rejectedTypes: string[];
}

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly favoritesService: FavoritesService,
    private readonly recipesService: RecipesService,
  ) {}

  async apply(userId: string, actions: SyncAction[]): Promise<SyncApplyResult> {
    let appliedCount = 0;
    const rejectedTypes: string[] = [];

    for (const action of actions) {
      if (!RECOGNIZED_ACTION_TYPES.has(action.type)) {
        rejectedTypes.push(action.type);
        continue;
      }
      await this.applyAction(userId, action);
      appliedCount += 1;
    }

    return { appliedCount, rejectedTypes };
  }

  private async applyAction(userId: string, action: SyncAction): Promise<void> {
    const alreadyApplied = await this.prisma.syncOperation.findUnique({
      where: {
        userId_idempotencyKey: {
          userId,
          idempotencyKey: action.idempotencyKey,
        },
      },
    });
    if (alreadyApplied) {
      return;
    }

    if (action.type === DRAFT_UPSERT_ACTION_TYPE) {
      const payload = this.recipesService.parseCreateRecipePayload(
        action.payload,
      );
      await this.prisma.$transaction(async (tx) => {
        await this.recipesService.upsertDraftWithClient(tx, userId, payload);
        await tx.syncOperation.create({
          data: {
            userId,
            idempotencyKey: action.idempotencyKey,
            actionType: action.type,
          },
        });
      });
      return;
    }

    const recipeId = this.extractRecipeId(action.payload);
    const operations =
      action.type === FAVORITE_ADD_ACTION_TYPE
        ? this.favoritesService.buildAddOperations(userId, recipeId)
        : this.favoritesService.buildRemoveOperations(userId, recipeId);

    await this.prisma.$transaction([
      ...operations,
      this.prisma.syncOperation.create({
        data: {
          userId,
          idempotencyKey: action.idempotencyKey,
          actionType: action.type,
        },
      }),
    ]);
  }

  private extractRecipeId(payload: unknown): string {
    if (
      typeof payload === 'object' &&
      payload !== null &&
      typeof (payload as Record<string, unknown>).recipeId === 'string'
    ) {
      return (payload as Record<string, unknown>).recipeId as string;
    }
    throw new BadRequestException('payload.recipeId is required');
  }
}
