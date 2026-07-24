import { Injectable } from '@nestjs/common';
import {
  CookingLevel,
  DietPreference,
  Prisma,
  RecipeCategory,
  TimeBucket,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DIET_COMPATIBILITY } from '../ranking/diet-compatibility';
import {
  PaginatedRecipes,
  RecipeSearchResult,
} from '../ranking/paginated-recipes.dto';
import {
  COOK_COMPLETIONS_WEIGHT,
  FAVORITES_ADDED_WEIGHT,
  OPENS_WEIGHT,
  weeklyWindowStart,
} from '../ranking/popularity.service';
import { RankingService } from '../ranking/ranking.service';
import { RecipeSummaryDto } from '../recipes/recipe-summary.dto';

export type ListingOrigin =
  'selecionadas' | 'categoria' | 'top_semana' | 'busca';

export interface ListingFilters {
  q?: string;
  category?: RecipeCategory;
  time?: TimeBucket;
  difficulty?: CookingLevel;
  diet?: DietPreference;
  allergens?: string[];
}

const DEFAULT_PAGE_LIMIT = 20;

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), 'utf8').toString('base64');
}

function decodeCursor(cursor: string): number {
  const offset = Number(Buffer.from(cursor, 'base64').toString('utf8'));
  return Number.isInteger(offset) && offset >= 0 ? offset : 0;
}

interface BucketedRow {
  id: string;
  bucket: number;
}

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rankingService: RankingService,
  ) {}

  /**
   * `'selecionadas'` reuses RankingService's full score formula as-is
   * (ADR-001) via a frozen signature (task_01) that takes no filters — the
   * explicit category/time/difficulty/diet/allergens filters therefore only
   * apply to the two-bucket origins below. Follow-up: extending
   * getSelectedForYouPaginated to accept filters is out of this task's scope.
   */
  async search(
    userId: string,
    origin: ListingOrigin,
    filters: ListingFilters,
    cursor?: string,
    limit: number = DEFAULT_PAGE_LIMIT,
  ): Promise<PaginatedRecipes> {
    if (origin === 'selecionadas') {
      return this.rankingService.getSelectedForYouPaginated(
        userId,
        cursor,
        limit,
      );
    }

    return this.searchTwoBucket(userId, origin, filters, cursor, limit);
  }

  private async searchTwoBucket(
    userId: string,
    origin: Exclude<ListingOrigin, 'selecionadas'>,
    filters: ListingFilters,
    cursor: string | undefined,
    limit: number,
  ): Promise<PaginatedRecipes> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const offset = cursor ? decodeCursor(cursor) : 0;
    const compatibleDiets = user?.dietPreference
      ? DIET_COMPATIBILITY[user.dietPreference]
      : null;

    const hasQuery = origin === 'busca' && !!filters.q;
    const windowStart = weeklyWindowStart();

    const compatibleDietClause =
      compatibleDiets === null
        ? Prisma.sql`TRUE`
        : Prisma.sql`r.diet_preference = ANY(${compatibleDiets}::"DietPreference"[])`;

    const filterClauses = [
      filters.category
        ? Prisma.sql`AND c.key = ${filters.category}::"RecipeCategory"`
        : Prisma.empty,
      filters.time
        ? Prisma.sql`AND r.time_bucket = ${filters.time}::"TimeBucket"`
        : Prisma.empty,
      filters.difficulty
        ? Prisma.sql`AND r.difficulty = ${filters.difficulty}::"CookingLevel"`
        : Prisma.empty,
      filters.diet
        ? Prisma.sql`AND r.diet_preference = ${filters.diet}::"DietPreference"`
        : Prisma.empty,
      filters.allergens?.length
        ? Prisma.sql`AND NOT EXISTS (
            SELECT 1 FROM recipe_allergens ra2
            WHERE ra2.recipe_id = r.id AND ra2.allergen_id = ANY(${filters.allergens})
          )`
        : Prisma.empty,
      hasQuery
        ? Prisma.sql`AND r.search_vector @@ websearch_to_tsquery('portuguese', ${filters.q})`
        : Prisma.empty,
    ];

    const signalClause = hasQuery
      ? Prisma.sql`ts_rank(r.search_vector, websearch_to_tsquery('portuguese', ${filters.q})) DESC`
      : Prisma.sql`(
          SELECT COALESCE(SUM(ds.opens), 0) * ${OPENS_WEIGHT}
            + COALESCE(SUM(ds.favorites_added), 0) * ${FAVORITES_ADDED_WEIGHT}
            + COALESCE(SUM(ds.cook_completions), 0) * ${COOK_COMPLETIONS_WEIGHT}
          FROM recipe_daily_stats ds
          WHERE ds.recipe_id = r.id AND ds.date >= ${windowStart}
        ) DESC`;

    const rows = await this.prisma.$queryRaw<BucketedRow[]>(Prisma.sql`
      SELECT r.id AS id,
        CASE WHEN (${compatibleDietClause}) AND NOT EXISTS (
          SELECT 1 FROM recipe_allergens ra
          JOIN user_allergies ua ON ua.allergen_id = ra.allergen_id
          WHERE ra.recipe_id = r.id AND ua.user_id = ${userId}
        ) THEN 0 ELSE 1 END AS bucket
      FROM recipes r
      JOIN categories c ON c.id = r.category_id
      WHERE r.status = 'aprovada'
        ${Prisma.join(filterClauses, ' ')}
      ORDER BY bucket ASC, ${signalClause}, r.id ASC
      LIMIT ${limit + 1} OFFSET ${offset}
    `);

    const hasNextPage = rows.length > limit;
    const page = rows.slice(0, limit);
    const orderedIds = page.map((row) => row.id);
    const bucketById = new Map(page.map((row) => [row.id, row.bucket]));

    const recipes = orderedIds.length
      ? await this.prisma.recipe.findMany({
          where: { id: { in: orderedIds } },
          include: { category: true },
        })
      : [];
    const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

    const items: RecipeSearchResult[] = orderedIds
      .map((id) => recipeById.get(id))
      .filter(
        (recipe): recipe is NonNullable<typeof recipe> => recipe !== undefined,
      )
      .map((recipe) => ({
        ...RecipeSummaryDto.fromRecipe(recipe),
        conflictsWithUser: bucketById.get(recipe.id) === 1,
      }));

    return {
      items,
      nextCursor: hasNextPage ? encodeCursor(offset + limit) : null,
    };
  }
}
