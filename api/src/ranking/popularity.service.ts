import { Injectable } from '@nestjs/common';
import { DietPreference, RecipeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeSummaryDto } from '../recipes/recipe-summary.dto';
import { isDietCompatible } from './diet-compatibility';

const POPULARITY_WINDOW_DAYS = 7;
const OPENS_WEIGHT = 1;
const FAVORITES_ADDED_WEIGHT = 2;
const COOK_COMPLETIONS_WEIGHT = 3;

// Lifetime eligibility floor (ADR-001) — calibration-pending thresholds
// flagged for product review post-launch, per docs/02-prd.md §9.5.
const ELIGIBILITY_MIN_OPENS = 10;
const ELIGIBILITY_MIN_COOK_COMPLETIONS = 3;

function weeklyWindowStart(): Date {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (POPULARITY_WINDOW_DAYS - 1));
  return start;
}

function weightedPopularity(sum: {
  opens: number | null;
  favoritesAdded: number | null;
  cookCompletions: number | null;
}): number {
  return (
    (sum.opens ?? 0) * OPENS_WEIGHT +
    (sum.favoritesAdded ?? 0) * FAVORITES_ADDED_WEIGHT +
    (sum.cookCompletions ?? 0) * COOK_COMPLETIONS_WEIGHT
  );
}

@Injectable()
export class PopularityService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeeklyPopularity(recipeId: string): Promise<number> {
    const aggregate = await this.prisma.recipeDailyStats.aggregate({
      where: { recipeId, date: { gte: weeklyWindowStart() } },
      _sum: { opens: true, favoritesAdded: true, cookCompletions: true },
    });
    return weightedPopularity(aggregate._sum);
  }

  async isEligible(recipeId: string): Promise<boolean> {
    const aggregate = await this.prisma.recipeDailyStats.aggregate({
      where: { recipeId },
      _sum: { opens: true, cookCompletions: true },
    });
    const totalOpens = aggregate._sum.opens ?? 0;
    const totalCompletions = aggregate._sum.cookCompletions ?? 0;
    return (
      totalOpens >= ELIGIBILITY_MIN_OPENS ||
      totalCompletions >= ELIGIBILITY_MIN_COOK_COMPLETIONS
    );
  }

  async getTopOfWeek(
    limit: number,
    userId?: string,
  ): Promise<RecipeSummaryDto[]> {
    const [recipes, user] = await Promise.all([
      this.prisma.recipe.findMany({
        where: { status: RecipeStatus.aprovada },
        include: { category: true },
      }),
      userId
        ? this.prisma.user.findUnique({ where: { id: userId } })
        : Promise.resolve(null),
    ]);

    const stats = await this.prisma.recipeDailyStats.groupBy({
      by: ['recipeId'],
      where: {
        recipeId: { in: recipes.map((recipe) => recipe.id) },
        date: { gte: weeklyWindowStart() },
      },
      _sum: { opens: true, favoritesAdded: true, cookCompletions: true },
    });
    const popularityByRecipeId = new Map(
      stats.map((row) => [row.recipeId, weightedPopularity(row._sum)]),
    );

    const userDiet: DietPreference | null = user?.dietPreference ?? null;

    const ranked = recipes
      .map((recipe) => ({
        recipe,
        popularity: popularityByRecipeId.get(recipe.id) ?? 0,
        compatible: userDiet
          ? isDietCompatible(recipe.dietPreference, userDiet)
          : false,
      }))
      .sort((a, b) => {
        if (b.popularity !== a.popularity) {
          return b.popularity - a.popularity;
        }
        return Number(b.compatible) - Number(a.compatible);
      });

    return ranked
      .slice(0, limit)
      .map(({ recipe }) => RecipeSummaryDto.fromRecipe(recipe));
  }

  async getTopOfWeekByCategory(
    categoryId: string,
    limit: number,
  ): Promise<RecipeSummaryDto[]> {
    const recipes = await this.prisma.recipe.findMany({
      where: { categoryId, status: RecipeStatus.aprovada },
      include: { category: true },
    });

    const stats = await this.prisma.recipeDailyStats.groupBy({
      by: ['recipeId'],
      where: {
        recipeId: { in: recipes.map((recipe) => recipe.id) },
        date: { gte: weeklyWindowStart() },
      },
      _sum: { opens: true, favoritesAdded: true, cookCompletions: true },
    });
    const popularityByRecipeId = new Map(
      stats.map((row) => [row.recipeId, weightedPopularity(row._sum)]),
    );

    return recipes
      .map((recipe) => ({
        recipe,
        popularity: popularityByRecipeId.get(recipe.id) ?? 0,
      }))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit)
      .map(({ recipe }) => RecipeSummaryDto.fromRecipe(recipe));
  }

  async getCategoryAverage(categoryId: string): Promise<number> {
    const recipes = await this.prisma.recipe.findMany({
      where: { categoryId, status: RecipeStatus.aprovada },
      select: { id: true },
    });
    if (recipes.length === 0) {
      return 0;
    }

    const stats = await this.prisma.recipeDailyStats.groupBy({
      by: ['recipeId'],
      where: {
        recipeId: { in: recipes.map((recipe) => recipe.id) },
        date: { gte: weeklyWindowStart() },
      },
      _sum: { opens: true, favoritesAdded: true, cookCompletions: true },
    });
    const totalPopularity = stats.reduce(
      (sum, row) => sum + weightedPopularity(row._sum),
      0,
    );

    return totalPopularity / recipes.length;
  }
}
