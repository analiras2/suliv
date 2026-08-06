import { Test } from '@nestjs/testing';
import { PrismaClient, RecipeCategory } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AllergenClassificationService } from '../src/allergen-classification/allergen-classification.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { RecipeImportModule } from '../src/recipe-import/recipe-import.module';
import { RecipeImportService } from '../src/recipe-import/recipe-import.service';
import {
  RecipeTranslationService,
  TranslatableRecipe,
  TranslatedRecipe,
} from '../src/recipe-import/recipe-translation.service';
import { SpoonacularClient } from '../src/recipe-import/spoonacular.client';

// Task 2 (Runtime recipe and import classification integration) proof: import
// promotion must classify the translated Portuguese ingredient names inside
// the same interactive transaction that creates the recipe and marks the
// candidate promoted (ADR-001, ADR-002).
describe('Recipe import classification integration (task_02)', () => {
  const prisma = new PrismaClient();
  const classifier = new AllergenClassificationService();
  let service: RecipeImportService;
  let categoryId: string;

  const translateToPortuguese = jest.fn<
    Promise<TranslatedRecipe>,
    [TranslatableRecipe]
  >();

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [PrismaModule, RecipeImportModule],
    })
      .overrideProvider(SpoonacularClient)
      .useValue({ searchVeganRecipes: jest.fn().mockResolvedValue([]) })
      .overrideProvider(RecipeTranslationService)
      .useValue({ translateToPortuguese })
      .compile();
    service = moduleFixture.get(RecipeImportService);

    const category = await prisma.category.upsert({
      where: { key: RecipeCategory.almoco_jantar },
      update: {},
      create: { key: RecipeCategory.almoco_jantar, label: 'Almoço/Jantar' },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function seedApprovedTerm(term: string) {
    const allergen = await prisma.allergen.create({
      data: { name: `Alergeno-import-${randomUUID()}`, status: 'approved' },
    });
    await prisma.allergenIngredientTerm.create({
      data: {
        allergenId: allergen.id,
        term,
        normalizedTerm: classifier.normalizeIngredientName(term),
      },
    });
    return allergen;
  }

  async function seedCandidate(overrides: {
    externalSourceId: string;
    ingredientName: string;
  }) {
    return prisma.recipeImportCandidate.create({
      data: {
        externalSourceId: overrides.externalSourceId,
        title: 'Vegan Lentil Soup',
        description: 'A hearty vegan soup.',
        category: RecipeCategory.almoco_jantar,
        prepTimeMinutes: 30,
        servings: 4,
        difficulty: 'intermediario',
        coverImageUrl: 'https://example.com/soup.jpg',
        ingredients: [
          {
            name: overrides.ingredientName,
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
      },
    });
  }

  it('IT-006 promoting a candidate translated to "leite condensado" commits the recipe and its Milk projection together', async () => {
    const milkTerm = `leite condensado it-006 ${randomUUID()}`;
    const milk = await seedApprovedTerm(milkTerm);
    const externalSourceId = `spoonacular:it-006-${randomUUID()}`;
    await seedCandidate({ externalSourceId, ingredientName: 'lentils' });
    translateToPortuguese.mockResolvedValue({
      title: `Sopa de lentilha com ${milkTerm}`,
      description: 'Uma sopa vegana reconfortante.',
      ingredientNames: [milkTerm],
      stepDescriptions: ['Cozinhe tudo junto em fogo baixo.'],
    });

    await service.runImport(1);

    const recipe = await prisma.recipe.findUniqueOrThrow({
      where: { externalSourceId },
      include: { ingredients: true },
    });
    expect(recipe.ingredients[0]?.name).toBe(milkTerm);
    const projection = await prisma.recipeAllergen.findMany({
      where: { recipeId: recipe.id },
    });
    expect(projection).toHaveLength(1);
    expect(projection[0].allergenId).toBe(milk.id);
    const candidate = await prisma.recipeImportCandidate.findUniqueOrThrow({
      where: { externalSourceId },
    });
    expect(candidate.promotedAt).not.toBeNull();
  });

  it('IT-007 a transaction failure after translation leaves no recipe, projection, or promotedAt residue, and a retry succeeds once', async () => {
    const externalSourceId = `spoonacular:it-007-${randomUUID()}`;
    await seedCandidate({ externalSourceId, ingredientName: 'lentils' });
    translateToPortuguese.mockResolvedValue({
      title: 'Sopa de lentilha',
      description: 'Uma sopa vegana reconfortante.',
      ingredientNames: ['lentilhas'],
      stepDescriptions: ['Cozinhe tudo junto em fogo baixo.'],
    });
    // Pre-occupy the unique externalSourceId on Recipe so the transaction's
    // tx.recipe.create step fails and rolls back everything after translation.
    const conflictingRecipe = await prisma.recipe.create({
      data: {
        slug: `conflict-${randomUUID()}`,
        externalSourceId,
        title: 'Receita conflitante',
        description: 'Ja ocupa este externalSourceId.',
        categoryId,
        prepTimeMinutes: 10,
        timeBucket: 'ate_15',
        servings: 1,
        difficulty: 'iniciante',
        dietPreference: 'vegano',
        status: 'em_analise',
      },
    });

    await expect(service.runImport(1)).rejects.toThrow();

    const candidateAfterFailure =
      await prisma.recipeImportCandidate.findUniqueOrThrow({
        where: { externalSourceId },
      });
    expect(candidateAfterFailure.promotedAt).toBeNull();
    const recipesAfterFailure = await prisma.recipe.findMany({
      where: { externalSourceId },
    });
    expect(recipesAfterFailure).toHaveLength(1);
    expect(recipesAfterFailure[0].id).toBe(conflictingRecipe.id);

    await prisma.recipe.delete({ where: { id: conflictingRecipe.id } });

    await service.runImport(1);

    const candidateAfterRetry =
      await prisma.recipeImportCandidate.findUniqueOrThrow({
        where: { externalSourceId },
      });
    expect(candidateAfterRetry.promotedAt).not.toBeNull();
    const recipesAfterRetry = await prisma.recipe.findMany({
      where: { externalSourceId },
    });
    expect(recipesAfterRetry).toHaveLength(1);
  });
});
