import {
  Category,
  CookingLevel,
  DietPreference,
  Prisma,
  Recipe,
  RecipeCategory,
  RecipeStatus,
  TimeBucket,
  User,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PopularityService } from './popularity.service';

const NOW = new Date('2026-07-16T12:00:00.000Z');

const category: Category = {
  id: 'category-1',
  key: RecipeCategory.almoco_jantar,
  label: 'Almoço/Jantar',
};

function recipeFixture(
  overrides: Partial<Recipe> = {},
): Recipe & { category: Category } {
  return {
    id: 'recipe-1',
    slug: 'recipe-1',
    authorId: null,
    title: 'Recipe 1',
    description: 'Description',
    coverImageUrl: null,
    categoryId: category.id,
    prepTimeMinutes: 20,
    timeBucket: TimeBucket.quinze_30,
    servings: 2,
    difficulty: CookingLevel.iniciante,
    dietPreference: DietPreference.flexitariano,
    status: RecipeStatus.aprovada,
    currentVersion: 1,
    adjustmentReason: null,
    adjustmentNote: null,
    authorMessageToModerator: null,
    termsVersionAccepted: null,
    submittedAt: null,
    approvedAt: null,
    removedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
    category,
  };
}

function userFixture(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'ana@example.com',
    name: null,
    username: 'ana',
    usernameUpdatedAt: null,
    avatarUrl: null,
    dietPreference: null,
    cookingLevel: null,
    cookingFrequency: null,
    onboardingCompletedAt: null,
    termsVersionAccepted: null,
    termsAcceptedAt: null,
    status: 'active',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

interface DailyStatsSum {
  opens: number | null;
  favoritesAdded?: number | null;
  cookCompletions: number | null;
}

interface DailyStatsGroup {
  recipeId: string;
  _sum: {
    opens: number | null;
    favoritesAdded: number | null;
    cookCompletions: number | null;
  };
}

describe('PopularityService', () => {
  const aggregateDailyStats = jest.fn<
    Promise<{ _sum: DailyStatsSum }>,
    [Prisma.RecipeDailyStatsAggregateArgs]
  >();
  const groupByDailyStats = jest.fn<
    Promise<DailyStatsGroup[]>,
    [Prisma.RecipeDailyStatsGroupByArgs]
  >();
  const findManyRecipe = jest.fn<
    Promise<Array<Recipe & { category: Category }>>,
    [Prisma.RecipeFindManyArgs]
  >();
  const findUniqueUser = jest.fn<
    Promise<User | null>,
    [Prisma.UserFindUniqueArgs]
  >();
  const prisma = {
    recipeDailyStats: {
      aggregate: aggregateDailyStats,
      groupBy: groupByDailyStats,
    },
    recipe: { findMany: findManyRecipe },
    user: { findUnique: findUniqueUser },
  };
  let service: PopularityService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PopularityService(prisma as unknown as PrismaService);
  });

  describe('isEligible', () => {
    it('UT-013 returns true when lifetime opens meets the floor regardless of completions', async () => {
      aggregateDailyStats.mockResolvedValue({
        _sum: { opens: 10, cookCompletions: 0 },
      });

      await expect(service.isEligible('recipe-1')).resolves.toBe(true);
      expect(aggregateDailyStats).toHaveBeenCalledWith({
        where: { recipeId: 'recipe-1' },
        _sum: { opens: true, cookCompletions: true },
      });
    });

    it('UT-014 returns true when lifetime completions meet the floor even with opens below the floor', async () => {
      aggregateDailyStats.mockResolvedValue({
        _sum: { opens: 2, cookCompletions: 3 },
      });

      await expect(service.isEligible('recipe-1')).resolves.toBe(true);
    });

    it('UT-015 returns false when both floors are missed by one', async () => {
      aggregateDailyStats.mockResolvedValue({
        _sum: { opens: 9, cookCompletions: 2 },
      });

      await expect(service.isEligible('recipe-1')).resolves.toBe(false);
    });

    it('uses an unbounded query with no date filter (ADR-001 distinct shape)', async () => {
      aggregateDailyStats.mockResolvedValue({
        _sum: { opens: 0, cookCompletions: 0 },
      });

      await service.isEligible('recipe-1');

      const call = aggregateDailyStats.mock.calls[0]?.[0];
      expect(call?.where).toEqual({ recipeId: 'recipe-1' });
    });
  });

  describe('getWeeklyPopularity', () => {
    it('UT-016 excludes rows older than the 7-day window from the sum', async () => {
      aggregateDailyStats.mockResolvedValue({
        _sum: { opens: 10, favoritesAdded: 5, cookCompletions: 2 },
      });

      const result = await service.getWeeklyPopularity('recipe-1');

      expect(result).toBe(10 + 2 * 5 + 3 * 2);
      const call = aggregateDailyStats.mock.calls[0]?.[0];
      const where = call?.where as { recipeId: string; date: { gte: Date } };
      expect(where.recipeId).toBe('recipe-1');
      expect(where.date.gte).toBeInstanceOf(Date);
      expect(call?._sum).toEqual({
        opens: true,
        favoritesAdded: true,
        cookCompletions: true,
      });
    });
  });

  describe('getTopOfWeek', () => {
    it('UT-019 orders by popularity descending and breaks ties by diet compatibility to the requesting user', async () => {
      const compatibleRecipe = recipeFixture({
        id: 'recipe-compatible',
        dietPreference: DietPreference.vegano,
      });
      const incompatibleRecipe = recipeFixture({
        id: 'recipe-incompatible',
        dietPreference: DietPreference.flexitariano,
      });
      const mostPopularRecipe = recipeFixture({
        id: 'recipe-most-popular',
        dietPreference: DietPreference.flexitariano,
      });

      findManyRecipe.mockResolvedValue([
        incompatibleRecipe,
        compatibleRecipe,
        mostPopularRecipe,
      ]);
      findUniqueUser.mockResolvedValue(
        userFixture({ dietPreference: DietPreference.vegano }),
      );
      groupByDailyStats.mockResolvedValue([
        {
          recipeId: 'recipe-compatible',
          _sum: { opens: 10, favoritesAdded: 0, cookCompletions: 0 },
        },
        {
          recipeId: 'recipe-incompatible',
          _sum: { opens: 10, favoritesAdded: 0, cookCompletions: 0 },
        },
        {
          recipeId: 'recipe-most-popular',
          _sum: { opens: 100, favoritesAdded: 0, cookCompletions: 0 },
        },
      ]);

      const result = await service.getTopOfWeek(5, 'user-1');

      expect(result.map((recipe) => recipe.id)).toEqual([
        'recipe-most-popular',
        'recipe-compatible',
        'recipe-incompatible',
      ]);
    });

    it('only queries recipes with status aprovada', async () => {
      findManyRecipe.mockResolvedValue([]);
      findUniqueUser.mockResolvedValue(null);
      groupByDailyStats.mockResolvedValue([]);

      await service.getTopOfWeek(5);

      const call = findManyRecipe.mock.calls[0]?.[0];
      expect(call?.where).toEqual({ status: RecipeStatus.aprovada });
    });
  });

  describe('getTopOfWeekByCategory', () => {
    it('orders recipes within the category by 7-day popularity descending', async () => {
      const lessPopular = recipeFixture({ id: 'recipe-less-popular' });
      const morePopular = recipeFixture({ id: 'recipe-more-popular' });

      findManyRecipe.mockResolvedValue([lessPopular, morePopular]);
      groupByDailyStats.mockResolvedValue([
        {
          recipeId: 'recipe-less-popular',
          _sum: { opens: 5, favoritesAdded: 0, cookCompletions: 0 },
        },
        {
          recipeId: 'recipe-more-popular',
          _sum: { opens: 50, favoritesAdded: 0, cookCompletions: 0 },
        },
      ]);

      const result = await service.getTopOfWeekByCategory('category-1', 5);

      expect(result.map((recipe) => recipe.id)).toEqual([
        'recipe-more-popular',
        'recipe-less-popular',
      ]);
    });

    it('filters by categoryId and status aprovada', async () => {
      findManyRecipe.mockResolvedValue([]);
      groupByDailyStats.mockResolvedValue([]);

      await service.getTopOfWeekByCategory('category-1', 3);

      const call = findManyRecipe.mock.calls[0]?.[0];
      expect(call?.where).toEqual({
        categoryId: 'category-1',
        status: RecipeStatus.aprovada,
      });
    });

    it('caps results at limit', async () => {
      const recipes = [
        recipeFixture({ id: 'recipe-a' }),
        recipeFixture({ id: 'recipe-b' }),
        recipeFixture({ id: 'recipe-c' }),
      ];
      findManyRecipe.mockResolvedValue(recipes);
      groupByDailyStats.mockResolvedValue([]);

      const result = await service.getTopOfWeekByCategory('category-1', 2);

      expect(result).toHaveLength(2);
    });
  });
});
