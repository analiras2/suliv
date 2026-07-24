import { NotFoundException } from '@nestjs/common';
import {
  Category,
  CookingLevel,
  DietPreference,
  EditorialBoost,
  Prisma,
  Recipe,
  RecipeAllergen,
  RecipeCategory,
  RecipeStatus,
  TimeBucket,
  User,
  UserAllergy,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PopularityService } from './popularity.service';
import { RankingService } from './ranking.service';

const NOW = new Date('2026-07-16T12:00:00.000Z');
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
    approvedAt: NOW,
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

describe('RankingService', () => {
  const findUniqueUser = jest.fn<
    Promise<User | null>,
    [Prisma.UserFindUniqueArgs]
  >();
  const findManyRecipe = jest.fn<
    Promise<Array<Recipe & { category: Category }>>,
    [Prisma.RecipeFindManyArgs]
  >();
  const findManyUserAllergy = jest.fn<
    Promise<UserAllergy[]>,
    [Prisma.UserAllergyFindManyArgs]
  >();
  const findManyRecipeAllergen = jest.fn<
    Promise<RecipeAllergen[]>,
    [Prisma.RecipeAllergenFindManyArgs]
  >();
  const findManyEditorialBoost = jest.fn<
    Promise<EditorialBoost[]>,
    [Prisma.EditorialBoostFindManyArgs]
  >();
  const prisma = {
    user: { findUnique: findUniqueUser },
    recipe: { findMany: findManyRecipe },
    userAllergy: { findMany: findManyUserAllergy },
    recipeAllergen: { findMany: findManyRecipeAllergen },
    editorialBoost: { findMany: findManyEditorialBoost },
  };
  const getWeeklyPopularity = jest.fn<Promise<number>, [string]>();
  const isEligible = jest.fn<Promise<boolean>, [string]>();
  const getCategoryAverage = jest.fn<Promise<number>, [string]>();
  const popularityService = {
    getWeeklyPopularity,
    isEligible,
    getCategoryAverage,
  };

  let service: RankingService;

  beforeEach(() => {
    jest.clearAllMocks();
    findManyUserAllergy.mockResolvedValue([]);
    findManyRecipeAllergen.mockResolvedValue([]);
    findManyEditorialBoost.mockResolvedValue([]);
    getWeeklyPopularity.mockResolvedValue(0);
    isEligible.mockResolvedValue(true);
    getCategoryAverage.mockResolvedValue(0);
    service = new RankingService(
      prisma as unknown as PrismaService,
      popularityService as unknown as PopularityService,
    );
  });

  it('throws NotFoundException for an unknown user', async () => {
    findUniqueUser.mockResolvedValue(null);
    await expect(service.getSelectedForYou('unknown', 5)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns an empty list when there are no aprovada candidates', async () => {
    findUniqueUser.mockResolvedValue(userFixture());
    findManyRecipe.mockResolvedValue([]);

    await expect(service.getSelectedForYou('user-1', 5)).resolves.toEqual([]);
  });

  it('never fetches recipes outside status aprovada', async () => {
    findUniqueUser.mockResolvedValue(userFixture());
    findManyRecipe.mockResolvedValue([]);

    await service.getSelectedForYou('user-1', 5);

    const call = findManyRecipe.mock.calls[0]?.[0];
    expect(call?.where).toEqual({ status: RecipeStatus.aprovada });
  });

  describe('cold-start slot', () => {
    it('UT-017 appends exactly 1 additional diet-compatible, most-recently-approved recipe not already selected', async () => {
      findUniqueUser.mockResolvedValue(
        userFixture({ dietPreference: DietPreference.vegano }),
      );
      const scoredTop = ['top-1', 'top-2', 'top-3', 'top-4'].map((id) =>
        recipeFixture({
          id,
          dietPreference: DietPreference.vegano,
          approvedAt: NOW,
        }),
      );
      const coldStartOlder = recipeFixture({
        id: 'cold-start-older',
        dietPreference: DietPreference.vegano,
        approvedAt: new Date(NOW.getTime() - 10 * MS_PER_DAY),
      });
      const coldStartNewest = recipeFixture({
        id: 'cold-start-newest',
        dietPreference: DietPreference.vegano,
        approvedAt: new Date(NOW.getTime() - 1 * MS_PER_DAY),
      });
      const incompatible = recipeFixture({
        id: 'incompatible',
        dietPreference: DietPreference.flexitariano,
        approvedAt: new Date(NOW.getTime() - 1 * MS_PER_DAY),
      });
      findManyRecipe.mockResolvedValue([
        ...scoredTop,
        coldStartOlder,
        coldStartNewest,
        incompatible,
      ]);
      // Every candidate is eligible and scores equally so the 4 "top-*"
      // recipes (all approved "now") sort ahead of the cold-start pool.
      isEligible.mockImplementation(async (recipeId) =>
        Promise.resolve(recipeId.startsWith('top-')),
      );

      const result = await service.getSelectedForYou('user-1', 5);

      expect(result).toHaveLength(5);
      expect(result.map((recipe) => recipe.id)).toEqual([
        'top-1',
        'top-2',
        'top-3',
        'top-4',
        'cold-start-newest',
      ]);
    });

    it('UT-018 returns fewer than 5 entries with no error when fewer than 4 other eligible recipes exist', async () => {
      findUniqueUser.mockResolvedValue(
        userFixture({ dietPreference: DietPreference.vegano }),
      );
      const onlyEligible = recipeFixture({
        id: 'eligible-1',
        dietPreference: DietPreference.vegano,
      });
      findManyRecipe.mockResolvedValue([onlyEligible]);
      isEligible.mockResolvedValue(true);

      const result = await service.getSelectedForYou('user-1', 5);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('eligible-1');
    });

    it('omits the cold-start slot when the top scores already consume every candidate', async () => {
      findUniqueUser.mockResolvedValue(
        userFixture({ dietPreference: DietPreference.vegano }),
      );
      const fourCandidates = ['a', 'b', 'c', 'd'].map((id) =>
        recipeFixture({ id, dietPreference: DietPreference.vegano }),
      );
      findManyRecipe.mockResolvedValue(fourCandidates);
      isEligible.mockResolvedValue(true);

      const result = await service.getSelectedForYou('user-1', 5);

      expect(result).toHaveLength(4);
    });
  });

  describe('allergy conflict', () => {
    it('penalizes but does not exclude a recipe with a conflicting allergen from the candidate pool', async () => {
      findUniqueUser.mockResolvedValue(userFixture());
      const conflicting = recipeFixture({ id: 'conflicting' });
      findManyRecipe.mockResolvedValue([conflicting]);
      findManyRecipeAllergen.mockResolvedValue([
        { recipeId: 'conflicting', allergenId: 'allergen-leite' },
      ]);
      findManyUserAllergy.mockResolvedValue([
        {
          userId: 'user-1',
          allergenId: 'allergen-leite',
          createdAt: NOW,
          updatedAt: NOW,
        },
      ]);
      isEligible.mockResolvedValue(true);

      const result = await service.getSelectedForYou('user-1', 5);

      expect(result.map((recipe) => recipe.id)).toEqual(['conflicting']);
    });
  });

  describe('getSelectedForYouPaginated', () => {
    it('UT-007 first page returns up to limit items and a non-null nextCursor when more exist', async () => {
      findUniqueUser.mockResolvedValue(userFixture());
      const candidates = ['a', 'b', 'c', 'd', 'e'].map((id) =>
        recipeFixture({ id }),
      );
      findManyRecipe.mockResolvedValue(candidates);

      const result = await service.getSelectedForYouPaginated(
        'user-1',
        undefined,
        3,
      );

      expect(result.items).toHaveLength(3);
      expect(result.items.map((item) => item.id)).toEqual(['a', 'b', 'c']);
      expect(result.nextCursor).not.toBeNull();
    });

    it('UT-008 the last page returns nextCursor: null', async () => {
      findUniqueUser.mockResolvedValue(userFixture());
      const candidates = ['a', 'b', 'c', 'd', 'e'].map((id) =>
        recipeFixture({ id }),
      );
      findManyRecipe.mockResolvedValue(candidates);

      const firstPage = await service.getSelectedForYouPaginated(
        'user-1',
        undefined,
        3,
      );
      const secondPage = await service.getSelectedForYouPaginated(
        'user-1',
        firstPage.nextCursor ?? undefined,
        3,
      );

      expect(secondPage.items.map((item) => item.id)).toEqual(['d', 'e']);
      expect(secondPage.nextCursor).toBeNull();
    });

    it('returns an empty page with a null cursor when there are no candidates', async () => {
      findUniqueUser.mockResolvedValue(userFixture());
      findManyRecipe.mockResolvedValue([]);

      const result = await service.getSelectedForYouPaginated(
        'user-1',
        undefined,
        3,
      );

      expect(result.items).toEqual([]);
      expect(result.nextCursor).toBeNull();
    });

    it('marks conflictsWithUser true for a diet-incompatible or allergy-conflicting recipe', async () => {
      findUniqueUser.mockResolvedValue(
        userFixture({ dietPreference: DietPreference.vegano }),
      );
      const incompatible = recipeFixture({
        id: 'incompatible',
        dietPreference: DietPreference.flexitariano,
      });
      findManyRecipe.mockResolvedValue([incompatible]);

      const result = await service.getSelectedForYouPaginated(
        'user-1',
        undefined,
        3,
      );

      expect(result.items[0].conflictsWithUser).toBe(true);
    });
  });
});
