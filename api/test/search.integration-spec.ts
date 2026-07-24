import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, RecipeCategory } from '@prisma/client';
import { generateKeyPairSync } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { RankingService } from '../src/ranking/ranking.service';
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

const ISSUER_PATH = '/auth/v1';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_PAGE_LIMIT = 20;

interface RecipeSearchResultBody {
  id: string;
  slug: string;
  dietPreference: string;
  category: { key: string };
  conflictsWithUser: boolean;
}

interface PaginatedRecipesBody {
  items: RecipeSearchResultBody[];
  nextCursor: string | null;
}

describe('GET /recipes/search (integration)', () => {
  const prisma = new PrismaClient();
  const trustedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const supabaseAdmin = { deleteUser: jest.fn<Promise<void>, [string]>() };
  let app: INestApplication<App>;
  let jwksServer: Server;
  let issuer: string;
  let rankingService: RankingService;

  beforeAll(async () => {
    const trustedJwk = trustedKeys.publicKey.export({ format: 'jwk' });
    Object.assign(trustedJwk, { alg: 'RS256', kid: 'trusted-key', use: 'sig' });
    jwksServer = createServer((_, response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ keys: [trustedJwk] }));
    });
    await new Promise<void>((resolve) =>
      jwksServer.listen(0, '127.0.0.1', resolve),
    );
    const { port } = jwksServer.address() as AddressInfo;
    process.env.SUPABASE_URL = `http://127.0.0.1:${port}`;
    process.env.SUPABASE_JWKS_URL = `http://127.0.0.1:${port}/jwks.json`;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    issuer = `${process.env.SUPABASE_URL}${ISSUER_PATH}`;

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseAdminService)
      .useValue(supabaseAdmin)
      .compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ forbidNonWhitelisted: true, whitelist: true }),
    );
    await app.init();
    rankingService = moduleFixture.get(RankingService);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    await new Promise<void>((resolve, reject) =>
      jwksServer.close((error) => (error ? reject(error) : resolve())),
    );
  });

  function tokenFor(userId: string, email = `${userId}@example.com`): string {
    return sign({ sub: userId, email }, trustedKeys.privateKey, {
      algorithm: 'RS256',
      expiresIn: '5m',
      issuer,
      keyid: 'trusted-key',
    });
  }

  function search(userId: string | null, query: string) {
    const req = request(app.getHttpServer()).get(`/recipes/search${query}`);
    return userId
      ? req.set('Authorization', `Bearer ${tokenFor(userId)}`)
      : req;
  }

  async function onboard(
    userId: string,
    dietPreference: 'vegano' | 'vegetariano' | 'flexitariano' | null,
    allergenIds: string[] = [],
  ): Promise<void> {
    await request(app.getHttpServer())
      .post('/me/bootstrap')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({})
      .expect(201);
    if (dietPreference === null) {
      return;
    }
    await request(app.getHttpServer())
      .post('/me/onboarding')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({
        diet_preference: dietPreference,
        allergen_ids: allergenIds,
        new_terms: [],
        cooking_level: 'iniciante',
        cooking_frequency: 'raramente',
      })
      .expect(201);
  }

  async function upsertCategory(key: RecipeCategory, label: string) {
    return prisma.category.upsert({
      where: { key },
      update: {},
      create: { key, label },
    });
  }

  async function upsertRecipe(params: {
    slug: string;
    title?: string;
    categoryId: string;
    dietPreference: 'vegano' | 'vegetariano' | 'flexitariano';
    timeBucket?: 'ate_15' | 'quinze_30' | 'trinta_60' | 'sessenta_mais';
    difficulty?: 'iniciante' | 'intermediario' | 'avancado';
    approvedAt?: Date;
  }) {
    const shared = {
      title: params.title ?? params.slug,
      description: `Fixture recipe for ${params.slug}`,
      categoryId: params.categoryId,
      prepTimeMinutes: 10,
      timeBucket: params.timeBucket ?? ('ate_15' as const),
      servings: 1,
      difficulty: params.difficulty ?? ('avancado' as const),
      dietPreference: params.dietPreference,
      status: 'aprovada' as const,
      approvedAt: params.approvedAt ?? new Date(),
    };
    return prisma.recipe.upsert({
      where: { slug: params.slug },
      update: shared,
      create: { slug: params.slug, ...shared },
    });
  }

  async function addWeeklyPopularity(
    recipeId: string,
    opens: number,
  ): Promise<void> {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 1);
    date.setUTCHours(0, 0, 0, 0);
    await prisma.recipeDailyStats.upsert({
      where: { recipeId_date: { recipeId, date } },
      update: { opens, favoritesAdded: 0, cookCompletions: 0 },
      create: { recipeId, date, opens, favoritesAdded: 0, cookCompletions: 0 },
    });
  }

  async function addLifetimeEligibility(
    recipeId: string,
    opens: number,
  ): Promise<void> {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 60);
    date.setUTCHours(0, 0, 0, 0);
    await prisma.recipeDailyStats.upsert({
      where: { recipeId_date: { recipeId, date } },
      update: { opens, favoritesAdded: 0, cookCompletions: 0 },
      create: { recipeId, date, opens, favoritesAdded: 0, cookCompletions: 0 },
    });
  }

  it('IT-001 origin=busca: compatible-bucket results appear before conflicting-bucket results', async () => {
    const category = await upsertCategory(
      RecipeCategory.sobremesa,
      'Sobremesa',
    );
    const user = 'it-001-search-user';
    await onboard(user, 'vegano');

    const compatible = await upsertRecipe({
      slug: 'it-001-search-compatible',
      title: 'BolodeFrutasBuscaIt001 vegano',
      categoryId: category.id,
      dietPreference: 'vegano',
    });
    const conflicting = await upsertRecipe({
      slug: 'it-001-search-conflicting',
      title: 'BolodeFrutasBuscaIt001 flexitariano',
      categoryId: category.id,
      dietPreference: 'flexitariano',
    });

    const response = await search(
      user,
      '?origin=busca&q=BolodeFrutasBuscaIt001',
    ).expect(200);
    const body = response.body as PaginatedRecipesBody;

    const compatibleIndex = body.items.findIndex((r) => r.id === compatible.id);
    const conflictingIndex = body.items.findIndex(
      (r) => r.id === conflicting.id,
    );
    expect(compatibleIndex).toBeGreaterThanOrEqual(0);
    expect(conflictingIndex).toBeGreaterThanOrEqual(0);
    expect(compatibleIndex).toBeLessThan(conflictingIndex);
    expect(body.items[compatibleIndex].conflictsWithUser).toBe(false);
    expect(body.items[conflictingIndex].conflictsWithUser).toBe(true);
  });

  it('IT-002 origin=categoria: every item belongs to the category, ordered by category-scoped popularity', async () => {
    const category = await upsertCategory(RecipeCategory.lanche, 'Lanche');
    const otherCategory = await upsertCategory(RecipeCategory.bebida, 'Bebida');
    const user = 'it-002-search-user';
    await onboard(user, null);

    const morePopular = await upsertRecipe({
      slug: 'it-002-search-more-popular',
      categoryId: category.id,
      dietPreference: 'flexitariano',
    });
    const lessPopular = await upsertRecipe({
      slug: 'it-002-search-less-popular',
      categoryId: category.id,
      dietPreference: 'flexitariano',
    });
    const otherCategoryRecipe = await upsertRecipe({
      slug: 'it-002-search-other-category',
      categoryId: otherCategory.id,
      dietPreference: 'flexitariano',
    });
    await addWeeklyPopularity(morePopular.id, 500);
    await addWeeklyPopularity(lessPopular.id, 1);
    await addWeeklyPopularity(otherCategoryRecipe.id, 1000);

    const response = await search(
      user,
      `?origin=categoria&category=${RecipeCategory.lanche}`,
    ).expect(200);
    const body = response.body as PaginatedRecipesBody;

    for (const item of body.items) {
      expect(item.category.key).toBe(RecipeCategory.lanche);
    }
    const moreIndex = body.items.findIndex((r) => r.id === morePopular.id);
    const lessIndex = body.items.findIndex((r) => r.id === lessPopular.id);
    expect(moreIndex).toBeGreaterThanOrEqual(0);
    expect(lessIndex).toBeGreaterThanOrEqual(0);
    expect(moreIndex).toBeLessThan(lessIndex);
  });

  it('IT-003 origin=top_semana: order reflects 7-day popularity across categories', async () => {
    const category = await upsertCategory(
      RecipeCategory.molhos_acompanhamentos,
      'Molhos/Acompanhamentos',
    );
    const user = 'it-003-search-user';
    await onboard(user, null);

    const morePopular = await upsertRecipe({
      slug: 'it-003-search-more-popular',
      categoryId: category.id,
      dietPreference: 'flexitariano',
    });
    const lessPopular = await upsertRecipe({
      slug: 'it-003-search-less-popular',
      categoryId: category.id,
      dietPreference: 'flexitariano',
    });
    await addWeeklyPopularity(morePopular.id, 900);
    await addWeeklyPopularity(lessPopular.id, 2);

    const response = await search(user, '?origin=top_semana').expect(200);
    const body = response.body as PaginatedRecipesBody;

    const moreIndex = body.items.findIndex((r) => r.id === morePopular.id);
    const lessIndex = body.items.findIndex((r) => r.id === lessPopular.id);
    expect(moreIndex).toBeGreaterThanOrEqual(0);
    expect(lessIndex).toBeGreaterThanOrEqual(0);
    expect(moreIndex).toBeLessThan(lessIndex);
  });

  it("IT-004 origin=selecionadas: first page's relative order matches getSelectedForYou's own order", async () => {
    const category = await upsertCategory(
      RecipeCategory.cafe_da_manha,
      'Café da manhã',
    );
    const user = 'it-004-search-user';
    await onboard(user, null);

    const recipes = await Promise.all(
      ['low', 'mid', 'high'].map((tag) =>
        upsertRecipe({
          slug: `it-004-search-${tag}`,
          categoryId: category.id,
          dietPreference: 'flexitariano',
          approvedAt: new Date(Date.now() - 30 * MS_PER_DAY),
        }),
      ),
    );
    await Promise.all(
      recipes.map((recipe) => addLifetimeEligibility(recipe.id, 15)),
    );
    const boostWeights = [5, 25, 60];
    await Promise.all(
      recipes.map((recipe, index) =>
        prisma.editorialBoost.create({
          data: {
            recipeId: recipe.id,
            weight: boostWeights[index],
            startsAt: new Date(Date.now() - MS_PER_DAY),
            endsAt: new Date(Date.now() + MS_PER_DAY),
          },
        }),
      ),
    );

    const expected = await rankingService.getSelectedForYou(
      user,
      DEFAULT_PAGE_LIMIT,
    );
    const response = await search(user, '?origin=selecionadas').expect(200);
    const body = response.body as PaginatedRecipesBody;

    const recipeIds = new Set(recipes.map((recipe) => recipe.id));
    const expectedOrder = expected
      .map((recipe) => recipe.id)
      .filter((id) => recipeIds.has(id));
    const actualOrder = body.items
      .map((item) => item.id)
      .filter((id) => recipeIds.has(id));
    expect(actualOrder).toEqual(expectedOrder);
  });

  it('IT-005 category and diet filters combined narrow results to satisfy both', async () => {
    const category = await upsertCategory(
      RecipeCategory.almoco_jantar,
      'Almoço/Jantar',
    );
    const otherCategory = await upsertCategory(
      RecipeCategory.sobremesa,
      'Sobremesa',
    );
    const user = 'it-005-search-user';
    await onboard(user, null);

    const matching = await upsertRecipe({
      slug: 'it-005-search-matching',
      categoryId: category.id,
      dietPreference: 'vegano',
    });
    const wrongDiet = await upsertRecipe({
      slug: 'it-005-search-wrong-diet',
      categoryId: category.id,
      dietPreference: 'flexitariano',
    });
    const wrongCategory = await upsertRecipe({
      slug: 'it-005-search-wrong-category',
      categoryId: otherCategory.id,
      dietPreference: 'vegano',
    });

    const response = await search(
      user,
      `?origin=busca&category=${RecipeCategory.almoco_jantar}&diet=vegano`,
    ).expect(200);
    const body = response.body as PaginatedRecipesBody;
    const ids = body.items.map((item) => item.id);

    expect(ids).toContain(matching.id);
    expect(ids).not.toContain(wrongDiet.id);
    expect(ids).not.toContain(wrongCategory.id);
    for (const item of body.items) {
      expect(item.category.key).toBe(RecipeCategory.almoco_jantar);
      expect(item.dietPreference).toBe('vegano');
    }
  });

  it('IT-006 a second page via nextCursor is disjoint from the first, with no gaps', async () => {
    const category = await upsertCategory(RecipeCategory.bebida, 'Bebida');
    const user = 'it-006-search-user';
    await onboard(user, null);

    const total = DEFAULT_PAGE_LIMIT + 2;
    const marker = 'PaginacaoBuscaIt006';
    const created = await Promise.all(
      Array.from({ length: total }, (_, index) =>
        upsertRecipe({
          slug: `it-006-search-${index}`,
          title: `${marker} receita ${index}`,
          categoryId: category.id,
          dietPreference: 'flexitariano',
        }),
      ),
    );

    const firstPage = await search(user, `?origin=busca&q=${marker}`).expect(
      200,
    );
    const firstBody = firstPage.body as PaginatedRecipesBody;
    expect(firstBody.items).toHaveLength(DEFAULT_PAGE_LIMIT);
    expect(firstBody.nextCursor).not.toBeNull();

    const secondPage = await search(
      user,
      `?origin=busca&q=${marker}&cursor=${encodeURIComponent(
        firstBody.nextCursor ?? '',
      )}`,
    ).expect(200);
    const secondBody = secondPage.body as PaginatedRecipesBody;
    expect(secondBody.items).toHaveLength(total - DEFAULT_PAGE_LIMIT);
    expect(secondBody.nextCursor).toBeNull();

    const firstIds = firstBody.items.map((item) => item.id);
    const secondIds = secondBody.items.map((item) => item.id);
    expect(new Set(firstIds).size).toBe(firstIds.length);
    for (const id of secondIds) {
      expect(firstIds).not.toContain(id);
    }
    const allIds = new Set([...firstIds, ...secondIds]);
    expect(allIds.size).toBe(total);
    for (const recipe of created) {
      expect(allIds.has(recipe.id)).toBe(true);
    }
  });

  it('IT-007 an omitted origin behaves identically to an explicit origin=busca', async () => {
    const category = await upsertCategory(
      RecipeCategory.sobremesa,
      'Sobremesa',
    );
    const user = 'it-007-search-user';
    await onboard(user, null);

    await upsertRecipe({
      slug: 'it-007-search-recipe',
      title: 'BoloDefaultOriginIt007',
      categoryId: category.id,
      dietPreference: 'flexitariano',
    });

    const withOrigin = await search(
      user,
      '?origin=busca&q=BoloDefaultOriginIt007',
    ).expect(200);
    const withoutOrigin = await search(
      user,
      '?q=BoloDefaultOriginIt007',
    ).expect(200);

    const withOriginBody = withOrigin.body as PaginatedRecipesBody;
    const withoutOriginBody = withoutOrigin.body as PaginatedRecipesBody;
    expect(withoutOriginBody.items.map((item) => item.id)).toEqual(
      withOriginBody.items.map((item) => item.id),
    );
  });

  it('IT-008 a request without a valid JWT returns 401', async () => {
    await search(null, '?origin=busca').expect(401);
  });
});
