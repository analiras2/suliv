import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Category,
  CommentStatus,
  CookingLevel,
  DietPreference,
  IngredientUnit,
  Prisma,
  Recipe,
  RecipeIngredient,
  RecipeStatus,
  RecipeStep,
  TimeBucket,
} from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { PopularityService } from '../ranking/popularity.service';
import { CreateRecipeDto } from './dto';
import { MyRecipeSummaryDto } from './my-recipe-summary.dto';
import { RecipeDetailDto } from './recipe-detail.dto';
import { RecipeSummaryDto } from './recipe-summary.dto';

export const DRAFT_UPSERT_ACTION_TYPE = 'draft_upsert';

const SUBMIT_DAILY_LIMIT = 5;
const MY_RECIPES_PAGE_SIZE = 20;

export interface DraftIngredientPayload {
  name: string;
  quantity: number | null;
  unit: IngredientUnit;
  scalesWithServings: boolean;
  order: number;
}

export interface DraftStepPayload {
  order: number;
  description: string;
  stepTimeSeconds: number | null;
}

export interface CreateRecipePayload {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  prepTimeMinutes: number;
  servings: number;
  difficulty: CookingLevel;
  dietPreference: DietPreference;
  ingredients: DraftIngredientPayload[];
  steps: DraftStepPayload[];
  authorMessageToModerator?: string;
  coverImageUrl?: string;
}

export type UpdateRecipePayload = Partial<Omit<CreateRecipePayload, 'id'>>;

export interface PaginatedMyRecipes {
  items: MyRecipeSummaryDto[];
  nextCursor: string | null;
}

type RecipeWithDetails = Recipe & {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
};

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

function deriveTimeBucket(prepTimeMinutes: number): TimeBucket {
  if (prepTimeMinutes <= 15) {
    return 'ate_15';
  }
  if (prepTimeMinutes <= 30) {
    return 'quinze_30';
  }
  if (prepTimeMinutes <= 60) {
    return 'trinta_60';
  }
  return 'sessenta_mais';
}

function slugify(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'receita';
}

// The slug embeds the client-generated id's prefix so a title-only collision
// never violates the unique constraint (ADR-003: ids originate client-side).
function slugFor(id: string, title: string): string {
  return `${slugify(title)}-${id.replace(/-/g, '').slice(0, 8)}`;
}

@Injectable()
export class RecipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly popularityService: PopularityService,
  ) {}

  listByCategory(
    categoryId: string,
    limit: number,
  ): Promise<RecipeSummaryDto[]> {
    return this.popularityService.getTopOfWeekByCategory(categoryId, limit);
  }

  listTopOfWeek(limit: number): Promise<RecipeSummaryDto[]> {
    return this.popularityService.getTopOfWeek(limit);
  }

  listCategories(): Promise<Category[]> {
    return this.prisma.category.findMany({ orderBy: { label: 'asc' } });
  }

  async getBySlug(slug: string, userId?: string): Promise<RecipeDetailDto> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { slug },
      include: {
        category: true,
        ingredients: true,
        steps: true,
      },
    });

    if (!recipe || recipe.status === 'removida') {
      throw new NotFoundException('Recipe not found');
    }
    if (recipe.status !== 'aprovada' && recipe.authorId !== userId) {
      throw new NotFoundException('Recipe not found');
    }

    const aggregate = await this.getRatingAggregate(recipe.id);
    const detail = RecipeDetailDto.fromRecipe(recipe, aggregate);
    if (!userId) {
      return detail;
    }

    const conflictingAllergens = await this.getConflictingAllergens(
      recipe.id,
      userId,
    );
    detail.conflictsWithUser = conflictingAllergens.length > 0;
    detail.conflictingAllergens = conflictingAllergens;
    // Favoritos hasn't been built yet — no favorites table exists to query
    // (out of this task's scope; see ADR-001/PRD §10 for the boundary).
    detail.isFavorited = false;

    return detail;
  }

  async create(userId: string, payload: CreateRecipePayload): Promise<Recipe> {
    try {
      return await this.prisma.recipe.create({
        data: {
          id: payload.id,
          authorId: userId,
          slug: slugFor(payload.id, payload.title),
          title: payload.title,
          description: payload.description,
          categoryId: payload.categoryId,
          prepTimeMinutes: payload.prepTimeMinutes,
          timeBucket: deriveTimeBucket(payload.prepTimeMinutes),
          servings: payload.servings,
          difficulty: payload.difficulty,
          dietPreference: payload.dietPreference,
          status: RecipeStatus.rascunho,
          authorMessageToModerator: payload.authorMessageToModerator,
          coverImageUrl: payload.coverImageUrl,
          ingredients: {
            create: payload.ingredients.map((ingredient) => ({
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              scalesWithServings: ingredient.scalesWithServings,
              order: ingredient.order,
            })),
          },
          steps: {
            create: payload.steps.map((step) => ({
              order: step.order,
              description: step.description,
              stepTimeSeconds: step.stepTimeSeconds,
            })),
          },
        },
      });
    } catch (error: unknown) {
      if (this.isForeignKeyViolation(error)) {
        throw new BadRequestException(
          'categoryId does not reference an existing category',
        );
      }
      throw error;
    }
  }

  async update(
    userId: string,
    recipeId: string,
    payload: UpdateRecipePayload,
  ): Promise<Recipe> {
    const recipe = await this.findOwnedRecipe(userId, recipeId);

    return this.prisma.$transaction(async (tx) => {
      const data: Prisma.RecipeUpdateInput = {};
      if (payload.title !== undefined) {
        data.title = payload.title;
      }
      if (payload.description !== undefined) {
        data.description = payload.description;
      }
      if (payload.categoryId !== undefined) {
        data.category = { connect: { id: payload.categoryId } };
      }
      if (payload.prepTimeMinutes !== undefined) {
        data.prepTimeMinutes = payload.prepTimeMinutes;
        data.timeBucket = deriveTimeBucket(payload.prepTimeMinutes);
      }
      if (payload.servings !== undefined) {
        data.servings = payload.servings;
      }
      if (payload.difficulty !== undefined) {
        data.difficulty = payload.difficulty;
      }
      if (payload.dietPreference !== undefined) {
        data.dietPreference = payload.dietPreference;
      }
      if (payload.authorMessageToModerator !== undefined) {
        data.authorMessageToModerator = payload.authorMessageToModerator;
      }
      if (payload.coverImageUrl !== undefined) {
        data.coverImageUrl = payload.coverImageUrl;
      }

      // ADR-002: only a recipe that is currently live re-enters moderation;
      // editing a rascunho never touches recipe_versions/current_version.
      if (recipe.status === RecipeStatus.aprovada) {
        const details = await tx.recipe.findUniqueOrThrow({
          where: { id: recipe.id },
          include: { ingredients: true, steps: true },
        });
        await tx.recipeVersion.create({
          data: {
            recipeId: recipe.id,
            versionNumber: recipe.currentVersion,
            snapshot: this.buildSnapshot(details),
          },
        });
        data.currentVersion = recipe.currentVersion + 1;
        data.adjustmentReason = null;
        data.adjustmentNote = null;
        data.status = RecipeStatus.em_analise;
      }

      if (payload.ingredients) {
        await tx.recipeIngredient.deleteMany({
          where: { recipeId: recipe.id },
        });
        await tx.recipeIngredient.createMany({
          data: payload.ingredients.map((ingredient) => ({
            recipeId: recipe.id,
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            scalesWithServings: ingredient.scalesWithServings,
            order: ingredient.order,
          })),
        });
      }
      if (payload.steps) {
        await tx.recipeStep.deleteMany({ where: { recipeId: recipe.id } });
        await tx.recipeStep.createMany({
          data: payload.steps.map((step) => ({
            recipeId: recipe.id,
            order: step.order,
            description: step.description,
            stepTimeSeconds: step.stepTimeSeconds,
          })),
        });
      }

      return tx.recipe.update({ where: { id: recipe.id }, data });
    });
  }

  async submit(userId: string, recipeId: string): Promise<Recipe> {
    const recipe = await this.findOwnedRecipe(userId, recipeId);
    if (!recipe.coverImageUrl) {
      throw new UnprocessableEntityException(
        'A cover image is required before submitting for moderation',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.termsVersionAccepted) {
      throw new UnprocessableEntityException(
        'The current terms of service must be accepted before submitting',
      );
    }

    const submittedToday = await this.prisma.recipe.count({
      where: { authorId: userId, submittedAt: { gte: todayUtc() } },
    });
    if (submittedToday >= SUBMIT_DAILY_LIMIT) {
      throw new HttpException(
        'Daily submission limit reached',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return this.prisma.recipe.update({
      where: { id: recipe.id },
      data: {
        status: RecipeStatus.em_analise,
        submittedAt: new Date(),
        termsVersionAccepted: user.termsVersionAccepted,
      },
    });
  }

  async delete(
    userId: string,
    recipeId: string,
    confirm: boolean,
  ): Promise<{ favoritesCount: number } | void> {
    const recipe = await this.findOwnedRecipe(userId, recipeId);
    const favoritesCount = await this.prisma.favorite.count({
      where: { recipeId: recipe.id },
    });
    if (!confirm) {
      return { favoritesCount };
    }

    await this.prisma.recipe.update({
      where: { id: recipe.id },
      data: { status: RecipeStatus.removida, removedAt: new Date() },
    });
  }

  async listMine(
    userId: string,
    status?: RecipeStatus,
    cursor?: string,
  ): Promise<PaginatedMyRecipes> {
    const offset = cursor ? decodeCursor(cursor) : 0;
    const where: Prisma.RecipeWhereInput = status
      ? { authorId: userId, status }
      : { authorId: userId, status: { not: RecipeStatus.removida } };

    const recipes = await this.prisma.recipe.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: MY_RECIPES_PAGE_SIZE + 1,
    });

    const hasMore = recipes.length > MY_RECIPES_PAGE_SIZE;
    const page = hasMore ? recipes.slice(0, MY_RECIPES_PAGE_SIZE) : recipes;

    return {
      items: page.map((recipe) => MyRecipeSummaryDto.fromRecipe(recipe)),
      nextCursor: hasMore ? encodeCursor(offset + page.length) : null,
    };
  }

  // Parses a sync action's untyped payload against the same contract POST
  // /recipes uses, since draft_upsert reuses CreateRecipePayload verbatim.
  parseCreateRecipePayload(payload: unknown): CreateRecipePayload {
    const dto = plainToInstance(
      CreateRecipeDto,
      (payload ?? {}) as Record<string, unknown>,
    );
    const errors = validateSync(dto, { whitelist: true });
    if (errors.length > 0) {
      throw new BadRequestException('Invalid draft_upsert payload');
    }
    return dto;
  }

  async upsertDraft(
    userId: string,
    payload: CreateRecipePayload,
  ): Promise<Recipe> {
    return this.prisma.$transaction((tx) =>
      this.upsertDraftWithClient(tx, userId, payload),
    );
  }

  // ADR-003/ADR-004: create-or-update the Recipe plus a full delete-and-
  // recreate of its ingredients/steps, all within the caller's transaction
  // (SyncService wraps this together with its own syncOperation record).
  async upsertDraftWithClient(
    tx: Prisma.TransactionClient,
    userId: string,
    payload: CreateRecipePayload,
  ): Promise<Recipe> {
    const recipe = await tx.recipe.upsert({
      where: { id: payload.id },
      create: {
        id: payload.id,
        authorId: userId,
        slug: slugFor(payload.id, payload.title),
        title: payload.title,
        description: payload.description,
        categoryId: payload.categoryId,
        prepTimeMinutes: payload.prepTimeMinutes,
        timeBucket: deriveTimeBucket(payload.prepTimeMinutes),
        servings: payload.servings,
        difficulty: payload.difficulty,
        dietPreference: payload.dietPreference,
        status: RecipeStatus.rascunho,
        authorMessageToModerator: payload.authorMessageToModerator,
        coverImageUrl: payload.coverImageUrl,
      },
      update: {
        title: payload.title,
        description: payload.description,
        categoryId: payload.categoryId,
        prepTimeMinutes: payload.prepTimeMinutes,
        timeBucket: deriveTimeBucket(payload.prepTimeMinutes),
        servings: payload.servings,
        difficulty: payload.difficulty,
        dietPreference: payload.dietPreference,
        authorMessageToModerator: payload.authorMessageToModerator,
      },
    });

    await tx.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
    await tx.recipeStep.deleteMany({ where: { recipeId: recipe.id } });

    if (payload.ingredients.length > 0) {
      await tx.recipeIngredient.createMany({
        data: payload.ingredients.map((ingredient) => ({
          recipeId: recipe.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          scalesWithServings: ingredient.scalesWithServings,
          order: ingredient.order,
        })),
      });
    }
    if (payload.steps.length > 0) {
      await tx.recipeStep.createMany({
        data: payload.steps.map((step) => ({
          recipeId: recipe.id,
          order: step.order,
          description: step.description,
          stepTimeSeconds: step.stepTimeSeconds,
        })),
      });
    }

    return recipe;
  }

  private async findOwnedRecipe(
    userId: string,
    recipeId: string,
  ): Promise<Recipe> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });
    if (!recipe || recipe.status === RecipeStatus.removida) {
      throw new NotFoundException('Recipe not found');
    }
    if (recipe.authorId !== userId) {
      throw new ForbiddenException('You do not own this recipe');
    }
    return recipe;
  }

  private buildSnapshot(recipe: RecipeWithDetails): Prisma.InputJsonValue {
    return {
      title: recipe.title,
      description: recipe.description,
      categoryId: recipe.categoryId,
      prepTimeMinutes: recipe.prepTimeMinutes,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      dietPreference: recipe.dietPreference,
      coverImageUrl: recipe.coverImageUrl,
      authorMessageToModerator: recipe.authorMessageToModerator,
      ingredients: recipe.ingredients.map((ingredient) => ({
        name: ingredient.name,
        quantity:
          ingredient.quantity === null ? null : Number(ingredient.quantity),
        unit: ingredient.unit,
        scalesWithServings: ingredient.scalesWithServings,
        order: ingredient.order,
      })),
      steps: recipe.steps.map((step) => ({
        order: step.order,
        description: step.description,
        stepTimeSeconds: step.stepTimeSeconds,
      })),
    };
  }

  private isForeignKeyViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    );
  }

  // Real-time aggregate, not denormalized (ADR-003): a comment hidden via
  // painel-administrativo-moderacao's hide_content resolution must drop out
  // of the average on the very next read, with no code path that can forget
  // to update a cached value.
  private async getRatingAggregate(
    recipeId: string,
  ): Promise<{ averageRating: number | null; ratingCount: number }> {
    const result = await this.prisma.commentRating.aggregate({
      where: { recipeId, status: CommentStatus.visible },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: result._count.rating === 0 ? null : result._avg.rating,
      ratingCount: result._count.rating,
    };
  }

  private async getConflictingAllergens(
    recipeId: string,
    userId: string,
  ): Promise<string[]> {
    const userAllergies = await this.prisma.userAllergy.findMany({
      where: { userId },
      select: { allergenId: true },
    });
    if (userAllergies.length === 0) {
      return [];
    }

    const conflicts = await this.prisma.recipeAllergen.findMany({
      where: {
        recipeId,
        allergenId: { in: userAllergies.map((allergy) => allergy.allergenId) },
      },
      select: { allergenId: true },
    });
    if (conflicts.length === 0) {
      return [];
    }

    const allergens = await this.prisma.allergen.findMany({
      where: { id: { in: conflicts.map((conflict) => conflict.allergenId) } },
      select: { name: true },
    });
    return allergens.map((allergen) => allergen.name);
  }
}
