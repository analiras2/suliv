import { Test } from '@nestjs/testing';
import { PrismaClient, RecipeCategory } from '@prisma/client';
import { PrismaModule } from '../src/prisma/prisma.module';
import { RecipesModule } from '../src/recipes/recipes.module';
import { RecipesService } from '../src/recipes/recipes.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('RecipesService (integration)', () => {
  const prisma = new PrismaClient();
  let recipesService: RecipesService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [PrismaModule, RecipesModule],
    }).compile();
    recipesService = moduleFixture.get(RecipesService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function upsertCategory(key: RecipeCategory, label: string) {
    return prisma.category.upsert({
      where: { key },
      update: {},
      create: { key, label },
    });
  }

  async function upsertRecipe(params: {
    slug: string;
    categoryId: string;
    createdAt: Date;
  }) {
    return prisma.recipe.upsert({
      where: { slug: params.slug },
      update: {
        categoryId: params.categoryId,
        createdAt: params.createdAt,
        status: 'aprovada',
      },
      create: {
        slug: params.slug,
        title: params.slug,
        description: `Fixture recipe for ${params.slug}`,
        categoryId: params.categoryId,
        prepTimeMinutes: 10,
        timeBucket: 'ate_15',
        servings: 1,
        difficulty: 'avancado',
        dietPreference: 'flexitariano',
        status: 'aprovada',
        approvedAt: params.createdAt,
        createdAt: params.createdAt,
      },
    });
  }

  async function addWeeklyPopularity(recipeId: string, opens: number) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 1);
    date.setUTCHours(0, 0, 0, 0);
    await prisma.recipeDailyStats.upsert({
      where: { recipeId_date: { recipeId, date } },
      update: { opens, favoritesAdded: 0, cookCompletions: 0 },
      create: { recipeId, date, opens, favoritesAdded: 0, cookCompletions: 0 },
    });
  }

  it('IT-005 listTopOfWeek orders by 7-day popularity, diverging from createdAt ordering', async () => {
    const category = await upsertCategory(RecipeCategory.lanche, 'Lanche');

    const olderButMorePopular = await upsertRecipe({
      slug: 'it-005-older-more-popular',
      categoryId: category.id,
      createdAt: new Date(Date.now() - 30 * MS_PER_DAY),
    });
    const newerButLessPopular = await upsertRecipe({
      slug: 'it-005-newer-less-popular',
      categoryId: category.id,
      createdAt: new Date(Date.now() - 1 * MS_PER_DAY),
    });
    await addWeeklyPopularity(olderButMorePopular.id, 100);
    await addWeeklyPopularity(newerButLessPopular.id, 1);

    const result = await recipesService.listTopOfWeek(1000);
    const olderIndex = result.findIndex((r) => r.id === olderButMorePopular.id);
    const newerIndex = result.findIndex((r) => r.id === newerButLessPopular.id);

    expect(olderIndex).toBeGreaterThanOrEqual(0);
    expect(newerIndex).toBeGreaterThanOrEqual(0);
    expect(olderIndex).toBeLessThan(newerIndex);
  });

  it('IT-006 listByCategory orders by 7-day popularity within the category, not recency', async () => {
    const category = await upsertCategory(
      RecipeCategory.molhos_acompanhamentos,
      'Molhos/Acompanhamentos',
    );

    const olderButMorePopular = await upsertRecipe({
      slug: 'it-006-older-more-popular',
      categoryId: category.id,
      createdAt: new Date(Date.now() - 30 * MS_PER_DAY),
    });
    const newerButLessPopular = await upsertRecipe({
      slug: 'it-006-newer-less-popular',
      categoryId: category.id,
      createdAt: new Date(Date.now() - 1 * MS_PER_DAY),
    });
    await addWeeklyPopularity(olderButMorePopular.id, 100);
    await addWeeklyPopularity(newerButLessPopular.id, 1);

    const result = await recipesService.listByCategory(category.id, 1000);
    const olderIndex = result.findIndex((r) => r.id === olderButMorePopular.id);
    const newerIndex = result.findIndex((r) => r.id === newerButLessPopular.id);

    expect(olderIndex).toBeGreaterThanOrEqual(0);
    expect(newerIndex).toBeGreaterThanOrEqual(0);
    expect(olderIndex).toBeLessThan(newerIndex);
  });
});
