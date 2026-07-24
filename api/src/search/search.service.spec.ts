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
import { PaginatedRecipes } from '../ranking/paginated-recipes.dto';
import { RankingService } from '../ranking/ranking.service';
import { SearchService } from './search.service';

const category: Category = {
  id: 'category-1',
  key: RecipeCategory.almoco_jantar,
  label: 'Almoço/Jantar',
};

function recipeFixture(overrides: Partial<Recipe> = {}): Recipe & {
  category: Category;
} {
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
    approvedAt: new Date('2026-07-01T00:00:00.000Z'),
    removedAt: null,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
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
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('SearchService', () => {
  const findUniqueUser = jest.fn<
    Promise<User | null>,
    [Prisma.UserFindUniqueArgs]
  >();
  const queryRaw = jest.fn<Promise<unknown>, unknown[]>();
  const findManyRecipe = jest.fn<
    Promise<Array<Recipe & { category: Category }>>,
    [Prisma.RecipeFindManyArgs]
  >();
  const prisma = {
    user: { findUnique: findUniqueUser },
    recipe: { findMany: findManyRecipe },
    $queryRaw: queryRaw,
  };
  const getSelectedForYouPaginated = jest.fn<
    Promise<PaginatedRecipes>,
    [string, string | undefined, number]
  >();
  const rankingService = { getSelectedForYouPaginated };

  let service: SearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    findUniqueUser.mockResolvedValue(userFixture());
    service = new SearchService(
      prisma as unknown as PrismaService,
      rankingService as unknown as RankingService,
    );
  });

  it('UT-001 assigns a diet-compatible, non-conflicting recipe to the compatible bucket', async () => {
    findUniqueUser.mockResolvedValue(
      userFixture({ dietPreference: DietPreference.vegano }),
    );
    queryRaw.mockResolvedValue([{ id: 'compatible-1', bucket: 0 }]);
    findManyRecipe.mockResolvedValue([
      recipeFixture({
        id: 'compatible-1',
        dietPreference: DietPreference.vegano,
      }),
    ]);

    const result = await service.search('user-1', 'busca', {});

    expect(result.items).toHaveLength(1);
    expect(result.items[0].conflictsWithUser).toBe(false);
  });

  it('UT-002 assigns a diet-mismatched/allergy-conflicting recipe to the conflicting bucket without excluding it', async () => {
    queryRaw.mockResolvedValue([{ id: 'conflicting-1', bucket: 1 }]);
    findManyRecipe.mockResolvedValue([recipeFixture({ id: 'conflicting-1' })]);

    const result = await service.search('user-1', 'busca', {});

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('conflicting-1');
    expect(result.items[0].conflictsWithUser).toBe(true);
  });

  it("UT-003 origin 'busca' with a query orders by text-match relevance (ts_rank)", async () => {
    queryRaw.mockResolvedValue([]);
    findManyRecipe.mockResolvedValue([]);

    await service.search('user-1', 'busca', { q: 'banana' });

    const sql = (queryRaw.mock.calls[0][0] as Prisma.Sql).sql;
    expect(sql).toContain('ts_rank');
    expect(sql).toContain('websearch_to_tsquery');
  });

  it("UT-004 origin 'categoria' orders by category-scoped popularity, not text relevance", async () => {
    queryRaw.mockResolvedValue([]);
    findManyRecipe.mockResolvedValue([]);

    await service.search('user-1', 'categoria', {
      category: RecipeCategory.lanche,
    });

    const sql = (queryRaw.mock.calls[0][0] as Prisma.Sql).sql;
    expect(sql).toContain('recipe_daily_stats');
    expect(sql).not.toContain('ts_rank');
    expect(sql).toContain('c.key');
  });

  it("UT-005 origin 'top_semana' orders by 7-day weekly popularity", async () => {
    queryRaw.mockResolvedValue([]);
    findManyRecipe.mockResolvedValue([]);

    await service.search('user-1', 'top_semana', {});

    const sql = (queryRaw.mock.calls[0][0] as Prisma.Sql).sql;
    expect(sql).toContain('recipe_daily_stats');
    expect(sql).not.toContain('ts_rank');
  });

  it('dispatches the selecionadas origin straight to getSelectedForYouPaginated with no bucketing', async () => {
    const paginated: PaginatedRecipes = { items: [], nextCursor: null };
    getSelectedForYouPaginated.mockResolvedValue(paginated);

    const result = await service.search(
      'user-1',
      'selecionadas',
      {},
      'cursor-1',
    );

    expect(getSelectedForYouPaginated).toHaveBeenCalledWith(
      'user-1',
      'cursor-1',
      20,
    );
    expect(queryRaw).not.toHaveBeenCalled();
    expect(result).toBe(paginated);
  });

  it('returns a non-null nextCursor when more results exist beyond the page', async () => {
    queryRaw.mockResolvedValue(
      Array.from({ length: 3 }, (_, index) => ({
        id: `recipe-${index}`,
        bucket: 0,
      })),
    );
    findManyRecipe.mockResolvedValue(
      Array.from({ length: 3 }, (_, index) =>
        recipeFixture({ id: `recipe-${index}` }),
      ),
    );

    const result = await service.search('user-1', 'busca', {}, undefined, 2);

    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).not.toBeNull();
  });

  it('returns a null nextCursor on the last page', async () => {
    queryRaw.mockResolvedValue([{ id: 'recipe-0', bucket: 0 }]);
    findManyRecipe.mockResolvedValue([recipeFixture({ id: 'recipe-0' })]);

    const result = await service.search('user-1', 'busca', {}, undefined, 2);

    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBeNull();
  });
});
