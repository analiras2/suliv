import { Injectable, Logger } from '@nestjs/common';
import {
  DietPreference,
  Prisma,
  RecipeImportCandidate,
  RecipeStatus,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { AllergenClassificationService } from '../allergen-classification/allergen-classification.service';
import { PrismaService } from '../prisma/prisma.service';
import { deriveTimeBucket } from '../recipes/recipes.service';
import {
  MappedIngredient,
  MappedRecipe,
  MappedStep,
  mapSpoonacularRecipe,
} from './recipe-import.mapper';
import {
  RecipeTranslationService,
  TranslatedRecipe,
} from './recipe-translation.service';
import { SpoonacularClient } from './spoonacular.client';

export const DEFAULT_PROMOTION_COUNT = 10;
// Spoonacular's complexSearch caps `number` at 100 per request. Each page
// costs 1 + 0.11 points (0.01 base + 0.025 each for fillIngredients,
// addRecipeInformation, addRecipeInstructions, addRecipeNutrition, all
// multiplied by the 100 results returned). Four pages cost 4*(1+11) = 48 of
// the free tier's 50 points/day — nearly the whole budget, so a run only
// spends it when the pool actually needs topping up (see MIN_POOL_SIZE).
const PAGE_SIZE = 100;
const PAGES_PER_REFILL = 4;
// Refilling is all-or-nothing against the daily quota, so the pool is topped
// up only when it drops below several runs' worth of recipes. This keeps a
// second run on the same day from spending quota it doesn't have.
const MIN_POOL_SIZE = 100;

function slugify(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'receita';
}

function slugFor(title: string, externalSourceId: string): string {
  const suffix = createHash('sha1')
    .update(externalSourceId)
    .digest('hex')
    .slice(0, 8);
  return `${slugify(title)}-${suffix}`;
}

@Injectable()
export class RecipeImportService {
  private readonly logger = new Logger(RecipeImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly spoonacularClient: SpoonacularClient,
    private readonly translationService: RecipeTranslationService,
    private readonly allergenClassification: AllergenClassificationService,
  ) {}

  async runImport(
    promotionCount: number = DEFAULT_PROMOTION_COUNT,
  ): Promise<void> {
    const fetchedCount = await this.refillCandidatePoolIfLow();
    const promotedCount = await this.promotePendingCandidates(promotionCount);

    this.logger.log(
      `Fetched ${fetchedCount} new candidate(s); promoted ${promotedCount} for moderation review.`,
    );
  }

  private async refillCandidatePoolIfLow(): Promise<number> {
    const pendingCount = await this.prisma.recipeImportCandidate.count({
      where: { promotedAt: null },
    });
    if (pendingCount >= MIN_POOL_SIZE) {
      this.logger.log(
        `Pool has ${pendingCount} pending candidate(s); skipping fetch.`,
      );
      return 0;
    }

    let addedCount = 0;

    for (let page = 0; page < PAGES_PER_REFILL; page += 1) {
      const offset = page * PAGE_SIZE;
      const batch = await this.spoonacularClient.searchVeganRecipes(
        PAGE_SIZE,
        offset,
      );
      const mappable = batch
        .map(mapSpoonacularRecipe)
        .filter((recipe): recipe is MappedRecipe => recipe !== null);

      for (const recipe of mappable) {
        const added = await this.addCandidate(recipe);
        if (added) {
          addedCount += 1;
        }
      }
    }

    return addedCount;
  }

  private async addCandidate(recipe: MappedRecipe): Promise<boolean> {
    try {
      await this.prisma.recipeImportCandidate.create({
        data: {
          externalSourceId: recipe.externalSourceId,
          title: recipe.title,
          description: recipe.description,
          category: recipe.category,
          prepTimeMinutes: recipe.prepTimeMinutes,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          coverImageUrl: recipe.coverImageUrl,
          ingredients: recipe.ingredients as unknown as Prisma.InputJsonValue,
          steps: recipe.steps as unknown as Prisma.InputJsonValue,
          externalNutritionData:
            recipe.externalNutritionData ?? Prisma.JsonNull,
        },
      });
      return true;
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        return false;
      }
      throw error;
    }
  }

  private async promotePendingCandidates(
    promotionCount: number,
  ): Promise<number> {
    const candidates = await this.prisma.recipeImportCandidate.findMany({
      where: { promotedAt: null },
      orderBy: { fetchedAt: 'asc' },
      take: promotionCount,
    });

    let promotedCount = 0;
    for (const candidate of candidates) {
      const promoted = await this.promoteCandidate(candidate);
      if (promoted) {
        promotedCount += 1;
      }
    }

    return promotedCount;
  }

  private async promoteCandidate(
    candidate: RecipeImportCandidate,
  ): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { key: candidate.category },
    });
    if (!category) {
      this.logger.warn(
        `Skipping "${candidate.title}": no category mapped for "${candidate.category}".`,
      );
      return false;
    }

    const ingredients = candidate.ingredients as unknown as MappedIngredient[];
    const steps = candidate.steps as unknown as MappedStep[];

    // Upstream content is English; the app is pt-BR only (PRD §19.5.4). A
    // failed translation leaves the candidate unpromoted so the next run
    // retries it, rather than publishing English into the moderation queue.
    let translated: TranslatedRecipe;
    try {
      translated = await this.translationService.translateToPortuguese({
        title: candidate.title,
        description: candidate.description,
        ingredientNames: ingredients.map((ingredient) => ingredient.name),
        stepDescriptions: steps.map((step) => step.description),
      });
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Skipping "${candidate.title}": translation failed (${reason}).`,
      );
      return false;
    }

    await this.prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: {
          slug: slugFor(translated.title, candidate.externalSourceId),
          externalSourceId: candidate.externalSourceId,
          authorId: null,
          title: translated.title,
          description: translated.description,
          categoryId: category.id,
          prepTimeMinutes: candidate.prepTimeMinutes,
          timeBucket: deriveTimeBucket(candidate.prepTimeMinutes),
          servings: candidate.servings,
          difficulty: candidate.difficulty,
          dietPreference: DietPreference.vegano,
          status: RecipeStatus.em_analise,
          submittedAt: new Date(),
          coverImageUrl: candidate.coverImageUrl,
          externalNutritionData:
            candidate.externalNutritionData ?? Prisma.JsonNull,
          ingredients: {
            create: ingredients.map((ingredient, index) => ({
              ...ingredient,
              name: translated.ingredientNames[index],
            })),
          },
          steps: {
            create: steps.map((step, index) => ({
              ...step,
              description: translated.stepDescriptions[index],
            })),
          },
        },
      });

      await this.allergenClassification.syncRecipeAllergens(
        tx,
        recipe.id,
        translated.ingredientNames,
      );

      await tx.recipeImportCandidate.update({
        where: { id: candidate.id },
        data: { promotedAt: new Date() },
      });
    });

    return true;
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
