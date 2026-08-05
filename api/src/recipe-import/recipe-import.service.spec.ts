import {
  Category,
  Prisma,
  Recipe,
  RecipeImportCandidate,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeImportService } from './recipe-import.service';
import {
  RecipeTranslationService,
  TranslatableRecipe,
  TranslatedRecipe,
} from './recipe-translation.service';
import { SpoonacularClient } from './spoonacular.client';
import { SpoonacularRecipe } from './spoonacular.types';

function spoonacularRecipeFixture(
  overrides: Partial<SpoonacularRecipe> = {},
): SpoonacularRecipe {
  return {
    id: 1,
    title: 'Vegan Lentil Soup',
    image: 'https://example.com/soup.jpg',
    readyInMinutes: 30,
    servings: 4,
    summary: 'A hearty vegan soup.',
    dishTypes: ['soup'],
    extendedIngredients: [{ name: 'lentils', amount: 200, unit: 'grams' }],
    analyzedInstructions: [
      { steps: [{ number: 1, step: 'Simmer everything together.' }] },
    ],
    nutrition: { calories: 350 },
    ...overrides,
  };
}

function candidateFixture(
  overrides: Partial<RecipeImportCandidate> = {},
): RecipeImportCandidate {
  return {
    id: 'candidate-1',
    externalSourceId: 'spoonacular:1',
    title: 'Vegan Lentil Soup',
    description: 'A hearty vegan soup.',
    category: 'almoco_jantar',
    prepTimeMinutes: 30,
    servings: 4,
    difficulty: 'intermediario',
    coverImageUrl: 'https://example.com/soup.jpg',
    ingredients: [
      {
        name: 'lentils',
        quantity: 200,
        unit: 'g',
        scalesWithServings: true,
        order: 1,
      },
    ],
    steps: [
      {
        order: 1,
        description: 'Simmer everything together.',
        stepTimeSeconds: null,
      },
    ],
    externalNutritionData: { calories: 350 },
    fetchedAt: new Date('2026-08-01T00:00:00.000Z'),
    promotedAt: null,
    ...overrides,
  };
}

describe('RecipeImportService', () => {
  const searchVeganRecipes = jest.fn<
    Promise<SpoonacularRecipe[]>,
    [number, number?]
  >();
  const findUniqueCategory = jest.fn<
    Promise<Category | null>,
    [Prisma.CategoryFindUniqueArgs]
  >();
  const createCandidate = jest.fn<
    Promise<RecipeImportCandidate>,
    [Prisma.RecipeImportCandidateCreateArgs]
  >();
  const findManyCandidate = jest.fn<
    Promise<RecipeImportCandidate[]>,
    [Prisma.RecipeImportCandidateFindManyArgs]
  >();
  const transaction = jest.fn<Promise<unknown[]>, [unknown[]]>();
  const createRecipe = jest.fn<Promise<Recipe>, [Prisma.RecipeCreateArgs]>();
  const updateCandidate = jest.fn<
    Promise<RecipeImportCandidate>,
    [Prisma.RecipeImportCandidateUpdateArgs]
  >();
  const translateToPortuguese = jest.fn<
    Promise<TranslatedRecipe>,
    [TranslatableRecipe]
  >();
  const countCandidate = jest.fn<
    Promise<number>,
    [Prisma.RecipeImportCandidateCountArgs]
  >();

  const prisma = {
    category: { findUnique: findUniqueCategory },
    recipeImportCandidate: {
      create: createCandidate,
      findMany: findManyCandidate,
      update: updateCandidate,
      count: countCandidate,
    },
    recipe: { create: createRecipe },
    $transaction: transaction,
  } as unknown as PrismaService;

  const spoonacularClient = {
    searchVeganRecipes,
  } as unknown as SpoonacularClient;

  const translationService = {
    translateToPortuguese,
  } as unknown as RecipeTranslationService;

  const service = new RecipeImportService(
    prisma,
    spoonacularClient,
    translationService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    searchVeganRecipes.mockResolvedValue([]);
    findUniqueCategory.mockResolvedValue({
      id: 'category-1',
      key: 'almoco_jantar',
      label: 'Almoço/Jantar',
    });
    createCandidate.mockResolvedValue(
      undefined as unknown as RecipeImportCandidate,
    );
    findManyCandidate.mockResolvedValue([]);
    countCandidate.mockResolvedValue(0);
    transaction.mockImplementation((ops: unknown[]) => Promise.resolve(ops));
    updateCandidate.mockResolvedValue(
      undefined as unknown as RecipeImportCandidate,
    );
    translateToPortuguese.mockResolvedValue({
      title: 'Sopa de Lentilha Vegana',
      description: 'Uma sopa vegana reconfortante.',
      ingredientNames: ['lentilhas'],
      stepDescriptions: ['Cozinhe tudo junto em fogo baixo.'],
    });
  });

  describe('refillCandidatePoolIfLow (via runImport)', () => {
    it('fetches 4 pages of 100 with increasing offsets', async () => {
      await service.runImport();

      expect(searchVeganRecipes).toHaveBeenCalledTimes(4);
      expect(searchVeganRecipes).toHaveBeenNthCalledWith(1, 100, 0);
      expect(searchVeganRecipes).toHaveBeenNthCalledWith(2, 100, 100);
      expect(searchVeganRecipes).toHaveBeenNthCalledWith(3, 100, 200);
      expect(searchVeganRecipes).toHaveBeenNthCalledWith(4, 100, 300);
    });

    it('inserts every mappable recipe returned across pages into the pool', async () => {
      searchVeganRecipes.mockResolvedValueOnce([
        spoonacularRecipeFixture({ id: 1 }),
        spoonacularRecipeFixture({ id: 2 }),
      ]);

      await service.runImport();

      expect(createCandidate).toHaveBeenCalledTimes(2);
      expect(createCandidate.mock.calls[0][0].data.externalSourceId).toBe(
        'spoonacular:1',
      );
      expect(
        createCandidate.mock.calls[0][0].data.externalNutritionData,
      ).toEqual({ calories: 350 });
    });

    it('discards recipes the mapper rejects for missing steps or ingredients', async () => {
      searchVeganRecipes.mockResolvedValueOnce([
        spoonacularRecipeFixture({ analyzedInstructions: [] }),
      ]);

      await service.runImport();

      expect(createCandidate).not.toHaveBeenCalled();
    });

    it('tolerates a candidate already present in the pool (unique-constraint race)', async () => {
      searchVeganRecipes.mockResolvedValueOnce([spoonacularRecipeFixture()]);
      createCandidate.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.runImport()).resolves.not.toThrow();
    });

    it('spends no quota when the pool still holds enough candidates', async () => {
      countCandidate.mockResolvedValue(100);

      await service.runImport();

      expect(searchVeganRecipes).not.toHaveBeenCalled();
    });

    it('refills once the pool drops below the threshold', async () => {
      countCandidate.mockResolvedValue(99);

      await service.runImport();

      expect(searchVeganRecipes).toHaveBeenCalledTimes(4);
    });
  });

  describe('promotePendingCandidates (via runImport)', () => {
    it('promotes up to 10 oldest unpromoted candidates, oldest first', async () => {
      findManyCandidate.mockResolvedValue([candidateFixture()]);

      await service.runImport();

      expect(findManyCandidate).toHaveBeenCalledWith({
        where: { promotedAt: null },
        orderBy: { fetchedAt: 'asc' },
        take: 10,
      });
      expect(transaction).toHaveBeenCalledTimes(1);
      expect(createRecipe.mock.calls[0][0].data.externalSourceId).toBe(
        'spoonacular:1',
      );
      expect(createRecipe.mock.calls[0][0].data.status).toBe('em_analise');
      expect(createRecipe.mock.calls[0][0].data.authorId).toBeNull();
      expect(updateCandidate.mock.calls[0][0].where).toEqual({
        id: 'candidate-1',
      });
    });

    it('skips promotion for a candidate whose category has no matching row', async () => {
      findManyCandidate.mockResolvedValue([candidateFixture()]);
      findUniqueCategory.mockResolvedValueOnce(null);

      await service.runImport();

      expect(transaction).not.toHaveBeenCalled();
    });

    it('persists the pt-BR translation, not the upstream English', async () => {
      findManyCandidate.mockResolvedValue([candidateFixture()]);

      await service.runImport();

      expect(translateToPortuguese).toHaveBeenCalledWith({
        title: 'Vegan Lentil Soup',
        description: 'A hearty vegan soup.',
        ingredientNames: ['lentils'],
        stepDescriptions: ['Simmer everything together.'],
      });

      const { data } = createRecipe.mock.calls[0][0];
      expect(data.title).toBe('Sopa de Lentilha Vegana');
      expect(data.description).toBe('Uma sopa vegana reconfortante.');
      expect(data.slug).toContain('sopa-de-lentilha-vegana');
    });

    it('keeps quantity and unit while replacing only the translated names', async () => {
      findManyCandidate.mockResolvedValue([candidateFixture()]);

      await service.runImport();

      const { data } = createRecipe.mock.calls[0][0];
      expect(data.ingredients).toEqual({
        create: [
          {
            name: 'lentilhas',
            quantity: 200,
            unit: 'g',
            scalesWithServings: true,
            order: 1,
          },
        ],
      });
      expect(data.steps).toEqual({
        create: [
          {
            order: 1,
            description: 'Cozinhe tudo junto em fogo baixo.',
            stepTimeSeconds: null,
          },
        ],
      });
    });

    it('honours an explicit count passed from the command line', async () => {
      findManyCandidate.mockResolvedValue([]);

      await service.runImport(25);

      expect(findManyCandidate).toHaveBeenCalledWith({
        where: { promotedAt: null },
        orderBy: { fetchedAt: 'asc' },
        take: 25,
      });
    });

    it('leaves the candidate unpromoted when translation fails', async () => {
      findManyCandidate.mockResolvedValue([candidateFixture()]);
      translateToPortuguese.mockRejectedValueOnce(new Error('upstream down'));

      await expect(service.runImport()).resolves.not.toThrow();

      expect(transaction).not.toHaveBeenCalled();
      expect(updateCandidate).not.toHaveBeenCalled();
    });
  });
});
