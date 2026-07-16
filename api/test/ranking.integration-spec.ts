import { Test } from '@nestjs/testing';
import { PrismaClient, RecipeCategory } from '@prisma/client';
import { PrismaModule } from '../src/prisma/prisma.module';
import { RankingModule } from '../src/ranking/ranking.module';
import { RankingService } from '../src/ranking/ranking.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('RankingService (integration)', () => {
  const prisma = new PrismaClient();
  let rankingService: RankingService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [PrismaModule, RankingModule],
    }).compile();
    rankingService = moduleFixture.get(RankingService);
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
    dietPreference: 'vegano' | 'vegetariano' | 'flexitariano';
    approvedAt: Date;
  }) {
    return prisma.recipe.upsert({
      where: { slug: params.slug },
      update: {
        dietPreference: params.dietPreference,
        approvedAt: params.approvedAt,
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
        dietPreference: params.dietPreference,
        status: 'aprovada',
        approvedAt: params.approvedAt,
      },
    });
  }

  async function addLifetimeEligibility(recipeId: string, opens: number) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 60);
    date.setUTCHours(0, 0, 0, 0);
    await prisma.recipeDailyStats.upsert({
      where: { recipeId_date: { recipeId, date } },
      update: { opens, favoritesAdded: 0, cookCompletions: 0 },
      create: { recipeId, date, opens, favoritesAdded: 0, cookCompletions: 0 },
    });
  }

  async function upsertUser(params: {
    id: string;
    dietPreference?: 'vegano' | 'vegetariano' | 'flexitariano' | null;
  }) {
    return prisma.user.upsert({
      where: { id: params.id },
      update: { dietPreference: params.dietPreference ?? null },
      create: {
        id: params.id,
        email: `${params.id}@example.com`,
        username: params.id,
        dietPreference: params.dietPreference ?? null,
      },
    });
  }

  it('IT-001 a diet-incompatible recipe never outranks a diet-compatible one at otherwise-equal signals', async () => {
    const category = await upsertCategory(
      RecipeCategory.molhos_acompanhamentos,
      'Molhos/Acompanhamentos',
    );
    const user = await upsertUser({
      id: 'it-001-user',
      dietPreference: 'vegano',
    });

    const approvedAt = new Date(Date.now() - 30 * MS_PER_DAY);
    const compatible = await upsertRecipe({
      slug: 'it-001-diet-compatible',
      categoryId: category.id,
      dietPreference: 'vegano',
      approvedAt,
    });
    const incompatible = await upsertRecipe({
      slug: 'it-001-diet-incompatible',
      categoryId: category.id,
      dietPreference: 'flexitariano',
      approvedAt,
    });
    await addLifetimeEligibility(compatible.id, 15);
    await addLifetimeEligibility(incompatible.id, 15);

    const result = await rankingService.getSelectedForYou(user.id, 1000);
    const compatibleIndex = result.findIndex((r) => r.id === compatible.id);
    const incompatibleIndex = result.findIndex((r) => r.id === incompatible.id);

    expect(compatibleIndex).toBeGreaterThanOrEqual(0);
    expect(incompatibleIndex).toBeGreaterThanOrEqual(0);
    expect(compatibleIndex).toBeLessThan(incompatibleIndex);
  });

  it('IT-002 an allergy-conflict recipe is excluded from scoring but reappears via the cold-start slot as the most recent diet-compatible recipe', async () => {
    const category = await upsertCategory(RecipeCategory.bebida, 'Bebida');
    const user = await upsertUser({
      id: 'it-002-user',
      dietPreference: 'vegetariano',
    });
    const allergen = await prisma.allergen.upsert({
      where: { name: 'Leite' },
      update: {},
      create: { name: 'Leite', status: 'approved' },
    });
    await prisma.userAllergy.upsert({
      where: {
        userId_allergenId: { userId: user.id, allergenId: allergen.id },
      },
      update: {},
      create: { userId: user.id, allergenId: allergen.id },
    });

    // Future approvedAt guarantees this fixture wins the "most recently
    // approved" cold-start tie-break against every other seeded recipe.
    const conflictRecipe = await upsertRecipe({
      slug: 'it-002-allergy-conflict',
      categoryId: category.id,
      dietPreference: 'vegetariano',
      approvedAt: new Date(Date.now() + 1000 * MS_PER_DAY),
    });
    await prisma.recipeAllergen.upsert({
      where: {
        recipeId_allergenId: {
          recipeId: conflictRecipe.id,
          allergenId: allergen.id,
        },
      },
      update: {},
      create: { recipeId: conflictRecipe.id, allergenId: allergen.id },
    });
    // No recipe_daily_stats rows: fails the lifetime eligibility floor, so
    // it can only ever appear via the cold-start slot, not the scored top.

    const result = await rankingService.getSelectedForYou(user.id, 5);

    expect(result.some((r) => r.id === conflictRecipe.id)).toBe(true);
  });

  it('IT-003/IT-004 an active editorial boost measurably improves rank; an expired one does not', async () => {
    const category = await upsertCategory(
      RecipeCategory.sobremesa,
      'Sobremesa',
    );
    const user = await upsertUser({ id: 'it-003-user', dietPreference: null });

    const target = await upsertRecipe({
      slug: 'it-003-editorial-boost-target',
      categoryId: category.id,
      dietPreference: 'flexitariano',
      approvedAt: new Date(Date.now() - 30 * MS_PER_DAY),
    });
    await addLifetimeEligibility(target.id, 15);

    const withoutBoost = await rankingService.getSelectedForYou(user.id, 1000);
    const baselineIndex = withoutBoost.findIndex((r) => r.id === target.id);
    expect(baselineIndex).toBeGreaterThanOrEqual(0);

    const activeBoost = await prisma.editorialBoost.create({
      data: {
        recipeId: target.id,
        weight: 50,
        appliedByAdminId: 'it-003-admin',
        startsAt: new Date(Date.now() - MS_PER_DAY),
        endsAt: new Date(Date.now() + MS_PER_DAY),
      },
    });

    const withActiveBoost = await rankingService.getSelectedForYou(
      user.id,
      1000,
    );
    const activeIndex = withActiveBoost.findIndex((r) => r.id === target.id);

    expect(activeIndex).toBeLessThan(baselineIndex);

    await prisma.editorialBoost.update({
      where: { id: activeBoost.id },
      data: {
        startsAt: new Date(Date.now() - 10 * MS_PER_DAY),
        endsAt: new Date(Date.now() - 5 * MS_PER_DAY),
      },
    });

    const withExpiredBoost = await rankingService.getSelectedForYou(
      user.id,
      1000,
    );
    const expiredIndex = withExpiredBoost.findIndex((r) => r.id === target.id);

    expect(expiredIndex).toBe(baselineIndex);
  });
});
