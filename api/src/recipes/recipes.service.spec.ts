import {
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Category, Prisma, Recipe } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PopularityService } from '../ranking/popularity.service';
import { RecipeSummaryDto } from './recipe-summary.dto';
import { CreateRecipePayload, RecipesService } from './recipes.service';

const category: Category = {
  id: 'category-1',
  key: 'almoco_jantar',
  label: 'Almoço/Jantar',
};

function recipeSummaryFixture(id: string): RecipeSummaryDto {
  return {
    id,
    slug: id,
    title: id,
    coverImageUrl: null,
    category,
    timeBucket: 'quinze_30',
    difficulty: 'iniciante',
    dietPreference: 'flexitariano',
  };
}

function recipeWithDetailsFixture(overrides: Partial<Recipe> = {}): Recipe & {
  category: Category;
  ingredients: unknown[];
  steps: unknown[];
} {
  return {
    id: 'recipe-1',
    slug: 'panqueca-de-banana-vegana',
    authorId: 'author-1',
    title: 'Panqueca de banana vegana',
    description: 'Panquecas fofinhas de banana.',
    coverImageUrl: null,
    categoryId: category.id,
    prepTimeMinutes: 15,
    timeBucket: 'ate_15',
    servings: 2,
    difficulty: 'iniciante',
    dietPreference: 'vegano',
    status: 'aprovada',
    currentVersion: 1,
    adjustmentReason: null,
    adjustmentNote: null,
    authorMessageToModerator: null,
    termsVersionAccepted: null,
    submittedAt: null,
    approvedAt: new Date(),
    removedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category,
    ingredients: [
      {
        id: 'ingredient-1',
        recipeId: 'recipe-1',
        name: 'Banana madura',
        quantity: new Prisma.Decimal(2),
        unit: 'unidade',
        scalesWithServings: true,
        order: 1,
      },
    ],
    steps: [
      {
        id: 'step-1',
        recipeId: 'recipe-1',
        order: 1,
        description: 'Amasse as bananas.',
        stepTimeSeconds: 120,
      },
    ],
    ...overrides,
  } as unknown as Recipe & {
    category: Category;
    ingredients: unknown[];
    steps: unknown[];
  };
}

describe('RecipesService', () => {
  const findManyCategory = jest.fn<
    Promise<Category[]>,
    [Prisma.CategoryFindManyArgs]
  >();
  const getTopOfWeek = jest.fn<Promise<RecipeSummaryDto[]>, [number]>();
  const getTopOfWeekByCategory = jest.fn<
    Promise<RecipeSummaryDto[]>,
    [string, number]
  >();
  const findUniqueRecipe = jest.fn();
  const findManyUserAllergy = jest.fn();
  const findManyRecipeAllergen = jest.fn();
  const findManyAllergen = jest.fn();
  const createRecipe = jest.fn();
  const countRecipe = jest.fn();
  const findManyRecipe = jest.fn();
  const updateRecipe = jest.fn();
  const countFavorite = jest.fn();
  const aggregateCommentRating = jest.fn();
  const findUniqueUser = jest.fn();
  const findUniqueOrThrowRecipe = jest.fn();
  const updateRecipeTx = jest.fn();
  const upsertRecipeTx = jest.fn();
  const createRecipeVersion = jest.fn();
  const deleteManyIngredient = jest.fn();
  const createManyIngredient = jest.fn();
  const deleteManyStep = jest.fn();
  const createManyStep = jest.fn();
  const txClient = {
    recipe: {
      findUniqueOrThrow: findUniqueOrThrowRecipe,
      update: updateRecipeTx,
      upsert: upsertRecipeTx,
    },
    recipeVersion: { create: createRecipeVersion },
    recipeIngredient: {
      deleteMany: deleteManyIngredient,
      createMany: createManyIngredient,
    },
    recipeStep: { deleteMany: deleteManyStep, createMany: createManyStep },
  };
  const transaction = jest.fn(
    (arg: unknown[] | ((tx: unknown) => Promise<unknown>)) => {
      if (typeof arg === 'function') {
        return arg(txClient);
      }
      return Promise.resolve(arg);
    },
  );
  const prisma = {
    category: { findMany: findManyCategory },
    recipe: {
      findUnique: findUniqueRecipe,
      create: createRecipe,
      count: countRecipe,
      findMany: findManyRecipe,
      update: updateRecipe,
    },
    userAllergy: { findMany: findManyUserAllergy },
    recipeAllergen: { findMany: findManyRecipeAllergen },
    allergen: { findMany: findManyAllergen },
    favorite: { count: countFavorite },
    commentRating: { aggregate: aggregateCommentRating },
    user: { findUnique: findUniqueUser },
    $transaction: transaction,
  };
  const popularityService = { getTopOfWeek, getTopOfWeekByCategory };
  let service: RecipesService;

  const ingredientPayload = {
    name: 'Banana',
    quantity: 2,
    unit: 'unidade' as const,
    scalesWithServings: true,
    order: 1,
  };
  const stepPayload = {
    order: 1,
    description: 'Misture tudo.',
    stepTimeSeconds: 60,
  };

  function createRecipePayloadFixture(
    overrides: Partial<CreateRecipePayload> = {},
  ): CreateRecipePayload {
    return {
      id: 'recipe-1',
      title: 'Panqueca de banana vegana',
      description: 'Panquecas fofinhas de banana.',
      categoryId: category.id,
      prepTimeMinutes: 15,
      servings: 2,
      difficulty: 'iniciante',
      dietPreference: 'vegano',
      ingredients: [ingredientPayload],
      steps: [stepPayload],
      ...overrides,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    upsertRecipeTx.mockResolvedValue({ id: 'recipe-1' });
    aggregateCommentRating.mockResolvedValue({
      _avg: { rating: null },
      _count: { rating: 0 },
    });
    service = new RecipesService(
      prisma as unknown as PrismaService,
      popularityService as unknown as PopularityService,
    );
  });

  it('UT-005 listByCategory delegates to PopularityService.getTopOfWeekByCategory with categoryId and limit', async () => {
    const summaries = [recipeSummaryFixture('recipe-1')];
    getTopOfWeekByCategory.mockResolvedValue(summaries);

    const result = await service.listByCategory('category-1', 3);

    expect(result).toBe(summaries);
    expect(getTopOfWeekByCategory).toHaveBeenCalledWith('category-1', 3);
  });

  it('UT-006 listTopOfWeek delegates to PopularityService.getTopOfWeek with limit', async () => {
    const summaries = [recipeSummaryFixture('recipe-1')];
    getTopOfWeek.mockResolvedValue(summaries);

    const result = await service.listTopOfWeek(5);

    expect(result).toBe(summaries);
    expect(getTopOfWeek).toHaveBeenCalledWith(5);
  });

  it('listCategories returns all seeded categories', async () => {
    const categories = [category];
    findManyCategory.mockResolvedValue(categories);

    await expect(service.listCategories()).resolves.toEqual(categories);
    expect(findManyCategory).toHaveBeenCalled();
  });

  describe('getBySlug (detalhe-receita-recalculo-porcoes)', () => {
    it('UT-006 approved recipe, no userId, resolves without isFavorited/conflictsWithUser/conflictingAllergens', async () => {
      findUniqueRecipe.mockResolvedValue(recipeWithDetailsFixture());

      const result = await service.getBySlug('panqueca-de-banana-vegana');

      expect(result.servings).toBe(2);
      expect(result.isFavorited).toBeUndefined();
      expect(result.conflictsWithUser).toBeUndefined();
      expect(result.conflictingAllergens).toBeUndefined();
      expect(findManyUserAllergy).not.toHaveBeenCalled();
    });

    it('UT-007 approved recipe, userId with an allergy conflict, resolves with conflictsWithUser/conflictingAllergens', async () => {
      findUniqueRecipe.mockResolvedValue(recipeWithDetailsFixture());
      findManyUserAllergy.mockResolvedValue([{ allergenId: 'allergen-leite' }]);
      findManyRecipeAllergen.mockResolvedValue([
        { allergenId: 'allergen-leite' },
      ]);
      findManyAllergen.mockResolvedValue([{ name: 'Leite' }]);

      const result = await service.getBySlug(
        'panqueca-de-banana-vegana',
        'user-1',
      );

      expect(result.conflictsWithUser).toBe(true);
      expect(result.conflictingAllergens).toEqual(['Leite']);
    });

    it('UT-008 a slug matching no recipe throws not-found', async () => {
      findUniqueRecipe.mockResolvedValue(null);

      await expect(service.getBySlug('does-not-exist')).rejects.toThrow(
        NotFoundException,
      );
    });

    it("UT-009 a recipe with status: 'removida' throws not-found", async () => {
      findUniqueRecipe.mockResolvedValue(
        recipeWithDetailsFixture({ status: 'removida' }),
      );

      await expect(
        service.getBySlug('panqueca-de-banana-vegana'),
      ).rejects.toThrow(NotFoundException);
    });

    it('UT-010 unapproved recipe, userId different from authorId, throws not-found', async () => {
      findUniqueRecipe.mockResolvedValue(
        recipeWithDetailsFixture({
          status: 'em_analise',
          authorId: 'author-1',
        }),
      );

      await expect(
        service.getBySlug('panqueca-de-banana-vegana', 'someone-else'),
      ).rejects.toThrow(NotFoundException);
    });

    it('UT-011 unapproved recipe, userId === authorId, resolves successfully', async () => {
      findUniqueRecipe.mockResolvedValue(
        recipeWithDetailsFixture({
          status: 'em_analise',
          authorId: 'author-1',
        }),
      );
      findManyUserAllergy.mockResolvedValue([]);

      const result = await service.getBySlug(
        'panqueca-de-banana-vegana',
        'author-1',
      );

      expect(result.slug).toBe('panqueca-de-banana-vegana');
      expect(result.conflictsWithUser).toBe(false);
    });

    it('UT-013 averageRating/ratingCount reflect only visible ratings, and are null/0 when none exist', async () => {
      findUniqueRecipe.mockResolvedValue(recipeWithDetailsFixture());
      aggregateCommentRating.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { rating: 2 },
      });

      const result = await service.getBySlug('panqueca-de-banana-vegana');

      expect(result.averageRating).toBe(4.5);
      expect(result.ratingCount).toBe(2);
      expect(aggregateCommentRating).toHaveBeenCalledWith({
        where: { recipeId: 'recipe-1', status: 'visible' },
        _avg: { rating: true },
        _count: { rating: true },
      });
    });

    it('UT-013 a recipe with zero visible ratings returns averageRating: null, ratingCount: 0', async () => {
      findUniqueRecipe.mockResolvedValue(recipeWithDetailsFixture());
      aggregateCommentRating.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });

      const result = await service.getBySlug('panqueca-de-banana-vegana');

      expect(result.averageRating).toBeNull();
      expect(result.ratingCount).toBe(0);
    });
  });

  describe('create', () => {
    it('creates a rascunho with a client-supplied id and nested ingredients/steps', async () => {
      createRecipe.mockResolvedValue({ id: 'recipe-1', status: 'rascunho' });

      await service.create('author-1', createRecipePayloadFixture());

      const [{ data }] = createRecipe.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(data.id).toBe('recipe-1');
      expect(data.authorId).toBe('author-1');
      expect(data.status).toBe('rascunho');
      expect(data.timeBucket).toBe('ate_15');
    });

    it('converts a foreign-key violation on categoryId into a 400', async () => {
      createRecipe.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('FK violation', {
          code: 'P2003',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.create('author-1', createRecipePayloadFixture()),
      ).rejects.toThrow('categoryId does not reference an existing category');
    });
  });

  describe('update (ADR-002)', () => {
    it('throws not-found when the recipe does not exist', async () => {
      findUniqueRecipe.mockResolvedValue(null);

      await expect(
        service.update('author-1', 'recipe-1', { title: 'Novo titulo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws forbidden when the caller does not own the recipe', async () => {
      findUniqueRecipe.mockResolvedValue(
        recipeWithDetailsFixture({ authorId: 'author-1' }),
      );

      await expect(
        service.update('someone-else', 'recipe-1', { title: 'Novo titulo' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('UT-012 editing a rascunho updates fields in place without touching recipe_versions', async () => {
      findUniqueRecipe.mockResolvedValue(
        recipeWithDetailsFixture({ status: 'rascunho', currentVersion: 1 }),
      );
      updateRecipeTx.mockResolvedValue({ id: 'recipe-1', status: 'rascunho' });

      await service.update('author-1', 'recipe-1', { title: 'Novo titulo' });

      expect(createRecipeVersion).not.toHaveBeenCalled();
      expect(updateRecipeTx).toHaveBeenCalledWith({
        where: { id: 'recipe-1' },
        data: { title: 'Novo titulo' },
      });
    });

    it('UT-011 editing an aprovada recipe snapshots a version, increments currentVersion, and re-enters moderation', async () => {
      findUniqueRecipe.mockResolvedValue(
        recipeWithDetailsFixture({ status: 'aprovada', currentVersion: 1 }),
      );
      findUniqueOrThrowRecipe.mockResolvedValue(recipeWithDetailsFixture());
      updateRecipeTx.mockResolvedValue({
        id: 'recipe-1',
        status: 'em_analise',
      });

      await service.update('author-1', 'recipe-1', {
        title: 'Titulo revisado',
      });

      const [{ data: versionData }] = createRecipeVersion.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      expect(versionData.recipeId).toBe('recipe-1');
      expect(versionData.versionNumber).toBe(1);

      expect(updateRecipeTx).toHaveBeenCalledWith({
        where: { id: 'recipe-1' },
        data: {
          title: 'Titulo revisado',
          currentVersion: 2,
          adjustmentReason: null,
          adjustmentNote: null,
          status: 'em_analise',
        },
      });
    });

    it('replaces ingredients/steps in full (delete-and-recreate) when provided', async () => {
      findUniqueRecipe.mockResolvedValue(
        recipeWithDetailsFixture({ status: 'rascunho' }),
      );
      updateRecipeTx.mockResolvedValue({ id: 'recipe-1' });

      await service.update('author-1', 'recipe-1', {
        ingredients: [ingredientPayload],
        steps: [stepPayload],
      });

      expect(deleteManyIngredient).toHaveBeenCalledWith({
        where: { recipeId: 'recipe-1' },
      });
      expect(createManyIngredient).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ recipeId: 'recipe-1', name: 'Banana' }),
        ],
      });
      expect(deleteManyStep).toHaveBeenCalledWith({
        where: { recipeId: 'recipe-1' },
      });
      expect(createManyStep).toHaveBeenCalledWith({
        data: [expect.objectContaining({ recipeId: 'recipe-1', order: 1 })],
      });
    });
  });

  describe('submit', () => {
    it('UT-009 rejects when the recipe has no cover_image_url', async () => {
      findUniqueRecipe.mockResolvedValue(
        recipeWithDetailsFixture({ coverImageUrl: null }),
      );

      await expect(service.submit('author-1', 'recipe-1')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('rejects when the user has not accepted the terms of service', async () => {
      findUniqueRecipe.mockResolvedValue(
        recipeWithDetailsFixture({ coverImageUrl: 'https://img/cover.jpg' }),
      );
      findUniqueUser.mockResolvedValue({ termsVersionAccepted: null });

      await expect(service.submit('author-1', 'recipe-1')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('UT-010 rejects with 429 once the daily submission limit is reached', async () => {
      findUniqueRecipe.mockResolvedValue(
        recipeWithDetailsFixture({ coverImageUrl: 'https://img/cover.jpg' }),
      );
      findUniqueUser.mockResolvedValue({ termsVersionAccepted: 'v1' });
      countRecipe.mockResolvedValue(5);

      await expect(
        service.submit('author-1', 'recipe-1'),
      ).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
    });

    it('submits successfully, stamping status/submittedAt/termsVersionAccepted', async () => {
      findUniqueRecipe.mockResolvedValue(
        recipeWithDetailsFixture({ coverImageUrl: 'https://img/cover.jpg' }),
      );
      findUniqueUser.mockResolvedValue({ termsVersionAccepted: 'v1' });
      countRecipe.mockResolvedValue(2);
      updateRecipe.mockResolvedValue({ status: 'em_analise' });

      await service.submit('author-1', 'recipe-1');

      const [{ where, data }] = updateRecipe.mock.calls[0] as [
        { where: Record<string, unknown>; data: Record<string, unknown> },
      ];
      expect(where).toEqual({ id: 'recipe-1' });
      expect(data.status).toBe('em_analise');
      expect(data.termsVersionAccepted).toBe('v1');
    });
  });

  describe('delete', () => {
    it('UT-013 confirm=false returns the favoritesCount preview without mutating the recipe', async () => {
      findUniqueRecipe.mockResolvedValue(recipeWithDetailsFixture());
      countFavorite.mockResolvedValue(3);

      const result = await service.delete('author-1', 'recipe-1', false);

      expect(result).toEqual({ favoritesCount: 3 });
      expect(updateRecipe).not.toHaveBeenCalled();
    });

    it('UT-014 confirm=true soft-deletes the recipe', async () => {
      findUniqueRecipe.mockResolvedValue(recipeWithDetailsFixture());
      countFavorite.mockResolvedValue(3);
      updateRecipe.mockResolvedValue({ status: 'removida' });

      await service.delete('author-1', 'recipe-1', true);

      const [{ where, data }] = updateRecipe.mock.calls[0] as [
        { where: Record<string, unknown>; data: Record<string, unknown> },
      ];
      expect(where).toEqual({ id: 'recipe-1' });
      expect(data.status).toBe('removida');
    });
  });

  describe('listMine', () => {
    it('UT-015 filters by the given status', async () => {
      findManyRecipe.mockResolvedValue([]);

      await service.listMine('author-1', 'aprovada');

      expect(findManyRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { authorId: 'author-1', status: 'aprovada' },
        }),
      );
    });

    it('excludes removida recipes when no status filter is given', async () => {
      findManyRecipe.mockResolvedValue([]);

      await service.listMine('author-1');

      expect(findManyRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { authorId: 'author-1', status: { not: 'removida' } },
        }),
      );
    });

    it('returns a nextCursor when there are more results than the page size', async () => {
      const page = Array.from({ length: 21 }, (_, index) =>
        recipeWithDetailsFixture({ id: `recipe-${index}` }),
      );
      findManyRecipe.mockResolvedValue(page);

      const result = await service.listMine('author-1');

      expect(result.items).toHaveLength(20);
      expect(result.nextCursor).not.toBeNull();
    });
  });

  describe('upsertDraft / upsertDraftWithClient (ADR-003, ADR-004)', () => {
    it('UT-003/UT-004 upserts the recipe then replaces ingredients/steps within the same transaction', async () => {
      const payload = createRecipePayloadFixture();

      await service.upsertDraft('author-1', payload);

      const [{ where, create }] = upsertRecipeTx.mock.calls[0] as [
        { where: Record<string, unknown>; create: Record<string, unknown> },
      ];
      expect(where).toEqual({ id: 'recipe-1' });
      expect(create.id).toBe('recipe-1');
      expect(create.authorId).toBe('author-1');
      expect(create.status).toBe('rascunho');
      expect(deleteManyIngredient).toHaveBeenCalledWith({
        where: { recipeId: 'recipe-1' },
      });
      expect(deleteManyStep).toHaveBeenCalledWith({
        where: { recipeId: 'recipe-1' },
      });
      expect(createManyIngredient).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ recipeId: 'recipe-1', name: 'Banana' }),
        ],
      });
      expect(createManyStep).toHaveBeenCalledWith({
        data: [expect.objectContaining({ recipeId: 'recipe-1', order: 1 })],
      });
    });

    it('does not call createMany when the payload has no ingredients/steps', async () => {
      const payload = createRecipePayloadFixture({
        ingredients: [],
        steps: [],
      });

      await service.upsertDraft('author-1', payload);

      expect(createManyIngredient).not.toHaveBeenCalled();
      expect(createManyStep).not.toHaveBeenCalled();
    });
  });

  describe('parseCreateRecipePayload', () => {
    it('parses a valid payload', () => {
      const payload = service.parseCreateRecipePayload(
        createRecipePayloadFixture({
          id: '11111111-1111-4111-8111-111111111111',
          categoryId: '22222222-2222-4222-8222-222222222222',
        }),
      );

      expect(payload.id).toBe('11111111-1111-4111-8111-111111111111');
      expect(payload.ingredients).toHaveLength(1);
    });

    it('rejects a payload missing required fields', () => {
      expect(() =>
        service.parseCreateRecipePayload({ id: 'recipe-1' }),
      ).toThrow();
    });
  });
});
