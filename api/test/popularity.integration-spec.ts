import { Test } from '@nestjs/testing';
import { PrismaClient, RecipeCategory } from '@prisma/client';
import { PopularityService } from '../src/ranking/popularity.service';
import { PrismaModule } from '../src/prisma/prisma.module';

describe('PopularityService (integration)', () => {
  const prisma = new PrismaClient();
  let popularityService: PopularityService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [PopularityService],
    }).compile();
    popularityService = moduleFixture.get(PopularityService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('IT-007 isEligible sums lifetime opens across multiple seeded daily rows and returns true at exactly the floor', async () => {
    const category = await prisma.category.upsert({
      where: { key: RecipeCategory.lanche },
      update: {},
      create: { key: RecipeCategory.lanche, label: 'Lanche' },
    });
    const recipe = await prisma.recipe.upsert({
      where: { slug: 'it-007-lifetime-eligibility-floor' },
      update: {},
      create: {
        slug: 'it-007-lifetime-eligibility-floor',
        title: 'IT-007 fixture',
        description: 'Fixture recipe for the lifetime eligibility floor test',
        categoryId: category.id,
        prepTimeMinutes: 10,
        timeBucket: 'ate_15',
        servings: 1,
        difficulty: 'iniciante',
        dietPreference: 'flexitariano',
        status: 'aprovada',
        approvedAt: new Date(),
      },
    });

    const dailyOpens = [4, 3, 3];
    for (const [index, opens] of dailyOpens.entries()) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - (60 + index));
      date.setUTCHours(0, 0, 0, 0);
      await prisma.recipeDailyStats.upsert({
        where: { recipeId_date: { recipeId: recipe.id, date } },
        update: { opens, favoritesAdded: 0, cookCompletions: 0 },
        create: {
          recipeId: recipe.id,
          date,
          opens,
          favoritesAdded: 0,
          cookCompletions: 0,
        },
      });
    }

    await expect(popularityService.isEligible(recipe.id)).resolves.toBe(true);
  });
});
