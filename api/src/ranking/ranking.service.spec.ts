import { NotFoundException } from '@nestjs/common';
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
import { RankingService } from './ranking.service';

const NOW = new Date('2026-07-15T12:00:00.000Z');

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

describe('RankingService', () => {
  const findUniqueUser = jest.fn<
    Promise<User | null>,
    [Prisma.UserFindUniqueArgs]
  >();
  const findManyRecipe = jest.fn<
    Promise<Array<Recipe & { category: Category }>>,
    [Prisma.RecipeFindManyArgs]
  >();
  const prisma = {
    user: { findUnique: findUniqueUser },
    recipe: { findMany: findManyRecipe },
  };
  let service: RankingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RankingService(prisma as unknown as PrismaService);
  });

  it('throws NotFoundException for an unknown user', async () => {
    findUniqueUser.mockResolvedValue(null);
    await expect(service.getSelectedForYou('unknown', 5)).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('UT-001 diet-hierarchy filtering', () => {
    it.each([
      [DietPreference.vegano, [DietPreference.vegano]],
      [
        DietPreference.vegetariano,
        [DietPreference.vegano, DietPreference.vegetariano],
      ],
      [
        DietPreference.flexitariano,
        [
          DietPreference.vegano,
          DietPreference.vegetariano,
          DietPreference.flexitariano,
        ],
      ],
    ])('%s only sees %j', async (dietPreference, compatibleDiets) => {
      findUniqueUser.mockResolvedValue(userFixture({ dietPreference }));
      findManyRecipe.mockResolvedValue([]);

      await service.getSelectedForYou('user-1', 5);

      expect(findManyRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: RecipeStatus.aprovada,
            dietPreference: { in: compatibleDiets },
          },
        }),
      );
    });
  });

  it('UT-002 applies no diet filter and does not throw when dietPreference is null', async () => {
    findUniqueUser.mockResolvedValue(userFixture({ dietPreference: null }));
    findManyRecipe.mockResolvedValue([recipeFixture()]);

    await expect(service.getSelectedForYou('user-1', 5)).resolves.toHaveLength(
      1,
    );

    expect(findManyRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: RecipeStatus.aprovada, dietPreference: undefined },
      }),
    );
  });

  it('UT-003 orders results by createdAt descending', async () => {
    findUniqueUser.mockResolvedValue(userFixture());
    findManyRecipe.mockResolvedValue([]);

    await service.getSelectedForYou('user-1', 5);

    expect(findManyRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    );
  });

  it('UT-004 returns exactly the available matches when fewer than limit', async () => {
    findUniqueUser.mockResolvedValue(
      userFixture({ dietPreference: DietPreference.vegano }),
    );
    const matches = [
      recipeFixture({ id: 'recipe-1', dietPreference: DietPreference.vegano }),
      recipeFixture({ id: 'recipe-2', dietPreference: DietPreference.vegano }),
    ];
    findManyRecipe.mockResolvedValue(matches);

    const result = await service.getSelectedForYou('user-1', 5);

    expect(result).toHaveLength(2);
    expect(findManyRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
  });

  it('never returns a recipe with a status other than aprovada', async () => {
    findUniqueUser.mockResolvedValue(userFixture());
    findManyRecipe.mockResolvedValue([]);

    await service.getSelectedForYou('user-1', 5);

    const call = findManyRecipe.mock.calls[0]?.[0];
    expect(call?.where?.status).toBe(RecipeStatus.aprovada);
  });
});
