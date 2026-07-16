import {
  Category,
  CookingLevel,
  DietPreference,
  Prisma,
  Recipe,
  RecipeCategory,
  RecipeStatus,
  TimeBucket,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecipesService } from './recipes.service';

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

describe('RecipesService', () => {
  const findManyRecipe = jest.fn<
    Promise<Array<Recipe & { category: Category }>>,
    [Prisma.RecipeFindManyArgs]
  >();
  const findManyCategory = jest.fn<
    Promise<Category[]>,
    [Prisma.CategoryFindManyArgs]
  >();
  const prisma = {
    recipe: { findMany: findManyRecipe },
    category: { findMany: findManyCategory },
  };
  let service: RecipesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RecipesService(prisma as unknown as PrismaService);
  });

  it('UT-005 filters by categoryId and caps results at limit', async () => {
    findManyRecipe.mockResolvedValue([recipeFixture()]);

    const result = await service.listByCategory('category-1', 3);

    expect(result).toHaveLength(1);
    expect(findManyRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { categoryId: 'category-1', status: RecipeStatus.aprovada },
        take: 3,
      }),
    );
  });

  it('UT-006 uses the same recency-ordering placeholder as getSelectedForYou', async () => {
    findManyRecipe.mockResolvedValue([]);

    await service.listTopOfWeek(5);

    expect(findManyRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: RecipeStatus.aprovada },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    );
  });

  it('listByCategory never returns a recipe with a status other than aprovada', async () => {
    findManyRecipe.mockResolvedValue([]);
    await service.listByCategory('category-1', 5);
    const call = findManyRecipe.mock.calls[0]?.[0];
    expect(call?.where?.status).toBe(RecipeStatus.aprovada);
  });

  it('listTopOfWeek never returns a recipe with a status other than aprovada', async () => {
    findManyRecipe.mockResolvedValue([]);
    await service.listTopOfWeek(5);
    const call = findManyRecipe.mock.calls[0]?.[0];
    expect(call?.where?.status).toBe(RecipeStatus.aprovada);
  });

  it('listCategories returns all seeded categories', async () => {
    const categories = [category];
    findManyCategory.mockResolvedValue(categories);

    await expect(service.listCategories()).resolves.toEqual(categories);
    expect(findManyCategory).toHaveBeenCalled();
  });
});
