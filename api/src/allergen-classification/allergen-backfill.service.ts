import { Injectable, Logger } from '@nestjs/common';
import { AllergenClassificationService } from './allergen-classification.service';
import { PrismaService } from '../prisma/prisma.service';

export const BACKFILL_BATCH_SIZE = 200;

export interface BackfillResult {
  processed: number;
  failedRecipeIds: string[];
}

@Injectable()
export class AllergenBackfillService {
  private readonly logger = new Logger(AllergenBackfillService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly allergenClassification: AllergenClassificationService,
  ) {}

  // ADR-002: a Nest CLI calls syncRecipeAllergens in batches to backfill
  // existing recipes. Every recipe regenerates its projection (not just
  // fills empty rows), each inside its own transaction, so a mid-run
  // failure never corrupts recipes already committed and a rerun always
  // converges to the same result.
  async runBackfill(
    batchSize: number = BACKFILL_BATCH_SIZE,
  ): Promise<BackfillResult> {
    let processed = 0;
    const failedRecipeIds: string[] = [];
    let cursor: string | undefined;

    for (;;) {
      const recipes = await this.prisma.recipe.findMany({
        orderBy: { id: 'asc' },
        take: batchSize,
        select: { id: true },
        ...(cursor
          ? { skip: 1, cursor: { id: cursor } }
          : ({} as Record<string, never>)),
      });
      if (recipes.length === 0) {
        break;
      }

      for (const recipe of recipes) {
        try {
          await this.prisma.$transaction(async (tx) => {
            const ingredients = await tx.recipeIngredient.findMany({
              where: { recipeId: recipe.id },
              select: { name: true },
            });
            await this.allergenClassification.syncRecipeAllergens(
              tx,
              recipe.id,
              ingredients.map((ingredient) => ingredient.name),
            );
          });
          processed += 1;
        } catch (error: unknown) {
          failedRecipeIds.push(recipe.id);
          this.logger.error(
            `Recipe ${recipe.id} failed to backfill: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      cursor = recipes[recipes.length - 1].id;
    }

    this.logger.log(
      `Backfill complete: processed=${processed} failed=${failedRecipeIds.length}` +
        (failedRecipeIds.length > 0
          ? ` failedRecipeIds=${failedRecipeIds.join(',')}`
          : ''),
    );

    return { processed, failedRecipeIds };
  }
}
