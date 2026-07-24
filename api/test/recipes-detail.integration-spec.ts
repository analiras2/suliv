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
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

const ISSUER_PATH = '/auth/v1';

interface RecipeDetailBody {
  id: string;
  slug: string;
  description: string;
  servings: number;
  dietPreference: string;
  category: { key: string };
  ingredients: unknown[];
  steps: unknown[];
  conflictsWithUser?: boolean;
  conflictingAllergens?: string[];
  isFavorited?: boolean;
  averageRating: number | null;
  ratingCount: number;
}

jest.setTimeout(20000);

describe('GET /recipes/:slug (integration)', () => {
  const prisma = new PrismaClient();
  const trustedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const supabaseAdmin = { deleteUser: jest.fn<Promise<void>, [string]>() };
  let app: INestApplication<App>;
  let jwksServer: Server;
  let issuer: string;

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

  function getBySlug(slug: string, userId?: string) {
    const req = request(app.getHttpServer()).get(`/recipes/${slug}`);
    return userId
      ? req.set('Authorization', `Bearer ${tokenFor(userId)}`)
      : req;
  }

  async function onboard(
    userId: string,
    allergenIds: string[] = [],
  ): Promise<void> {
    await request(app.getHttpServer())
      .post('/me/bootstrap')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({})
      .expect(201);
    await request(app.getHttpServer())
      .post('/me/onboarding')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({
        diet_preference: 'flexitariano',
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
    categoryId: string;
    status?: 'aprovada' | 'em_analise' | 'removida';
    authorId?: string;
  }) {
    const shared = {
      title: params.slug,
      description: `Fixture recipe for ${params.slug}`,
      categoryId: params.categoryId,
      prepTimeMinutes: 10,
      timeBucket: 'ate_15' as const,
      servings: 4,
      difficulty: 'iniciante' as const,
      dietPreference: 'flexitariano' as const,
      status: params.status ?? ('aprovada' as const),
      authorId: params.authorId,
      approvedAt:
        (params.status ?? 'aprovada') === 'aprovada' ? new Date() : null,
    };
    return prisma.recipe.upsert({
      where: { slug: params.slug },
      update: shared,
      create: { slug: params.slug, ...shared },
    });
  }

  async function addIngredientAndStep(recipeId: string) {
    await prisma.recipeIngredient.upsert({
      where: { recipeId_order: { recipeId, order: 1 } },
      update: {},
      create: {
        recipeId,
        order: 1,
        name: 'Sal',
        quantity: 1,
        unit: 'pitada',
        scalesWithServings: false,
      },
    });
    await prisma.recipeStep.upsert({
      where: { recipeId_order: { recipeId, order: 1 } },
      update: {},
      create: {
        recipeId,
        order: 1,
        description: 'Misture os ingredientes.',
        stepTimeSeconds: 60,
      },
    });
  }

  it('IT-001 public request (no Authorization) returns 200 with content, no authenticated-only fields', async () => {
    const category = await upsertCategory(RecipeCategory.lanche, 'Lanche');
    const recipe = await upsertRecipe({
      slug: 'it-001-recipe-detail-public',
      categoryId: category.id,
    });
    await addIngredientAndStep(recipe.id);

    const response = await getBySlug('it-001-recipe-detail-public').expect(200);
    const body = response.body as RecipeDetailBody;

    expect(body.slug).toBe('it-001-recipe-detail-public');
    expect(body.servings).toBe(4);
    expect(body.ingredients.length).toBeGreaterThan(0);
    expect(body.steps.length).toBeGreaterThan(0);
    expect(body.conflictsWithUser).toBeUndefined();
    expect(body.conflictingAllergens).toBeUndefined();
    expect(body.isFavorited).toBeUndefined();
  });

  it('IT-002 authenticated request for a conflicting-allergy user returns 200 with warning fields populated', async () => {
    const category = await upsertCategory(
      RecipeCategory.sobremesa,
      'Sobremesa',
    );
    const recipe = await upsertRecipe({
      slug: 'it-002-recipe-detail-conflict',
      categoryId: category.id,
    });
    await addIngredientAndStep(recipe.id);
    const allergen = await prisma.allergen.upsert({
      where: { name: 'Leite' },
      update: { status: 'approved' },
      create: { name: 'Leite', status: 'approved' },
    });
    await prisma.recipeAllergen.upsert({
      where: {
        recipeId_allergenId: { recipeId: recipe.id, allergenId: allergen.id },
      },
      update: {},
      create: { recipeId: recipe.id, allergenId: allergen.id },
    });
    const user = 'it-002-recipe-detail-user';
    await onboard(user, [allergen.id]);

    const response = await getBySlug(
      'it-002-recipe-detail-conflict',
      user,
    ).expect(200);
    const body = response.body as RecipeDetailBody;

    expect(body.conflictsWithUser).toBe(true);
    expect(body.conflictingAllergens).toContain('Leite');
  });

  it('IT-003 a nonexistent slug returns 404', async () => {
    await getBySlug('it-003-does-not-exist').expect(404);
  });

  it("IT-004 a 'removida' recipe returns 404", async () => {
    const category = await upsertCategory(RecipeCategory.bebida, 'Bebida');
    await upsertRecipe({
      slug: 'it-004-recipe-detail-removida',
      categoryId: category.id,
      status: 'removida',
    });

    await getBySlug('it-004-recipe-detail-removida').expect(404);
  });

  it('IT-005 unapproved recipe, non-author JWT, returns 404', async () => {
    const category = await upsertCategory(
      RecipeCategory.molhos_acompanhamentos,
      'Molhos/Acompanhamentos',
    );
    const author = 'it-005-recipe-detail-author';
    await onboard(author);
    await upsertRecipe({
      slug: 'it-005-recipe-detail-unapproved',
      categoryId: category.id,
      status: 'em_analise',
      authorId: author,
    });
    const otherUser = 'it-005-recipe-detail-other';
    await onboard(otherUser);

    await getBySlug('it-005-recipe-detail-unapproved', otherUser).expect(404);
  });

  it("IT-006 unapproved recipe, author's own JWT, returns 200", async () => {
    const category = await upsertCategory(
      RecipeCategory.almoco_jantar,
      'Almoço/Jantar',
    );
    const author = 'it-006-recipe-detail-author';
    await onboard(author);
    const recipe = await upsertRecipe({
      slug: 'it-006-recipe-detail-unapproved-author',
      categoryId: category.id,
      status: 'em_analise',
      authorId: author,
    });
    await addIngredientAndStep(recipe.id);

    const response = await getBySlug(
      'it-006-recipe-detail-unapproved-author',
      author,
    ).expect(200);
    const body = response.body as RecipeDetailBody;

    expect(body.slug).toBe('it-006-recipe-detail-unapproved-author');
  });

  it('IT-009 averageRating/ratingCount match seeded visible ratings and exclude hidden ones', async () => {
    const category = await upsertCategory(
      RecipeCategory.cafe_da_manha,
      'Café da Manhã',
    );
    const recipe = await upsertRecipe({
      slug: 'it-009-recipe-detail-aggregate',
      categoryId: category.id,
    });
    await addIngredientAndStep(recipe.id);
    await prisma.commentRating.createMany({
      data: [
        { recipeId: recipe.id, userId: 'it-009-rater-1', rating: 4 },
        { recipeId: recipe.id, userId: 'it-009-rater-2', rating: 5 },
        {
          recipeId: recipe.id,
          userId: 'it-009-rater-3',
          rating: 1,
          status: 'hidden',
        },
      ],
    });

    const response = await getBySlug('it-009-recipe-detail-aggregate').expect(
      200,
    );
    const body = response.body as RecipeDetailBody;

    expect(body.averageRating).toBe(4.5);
    expect(body.ratingCount).toBe(2);
  });

  it('IT-009 a recipe with zero visible ratings returns averageRating: null, ratingCount: 0', async () => {
    const category = await upsertCategory(
      RecipeCategory.molhos_acompanhamentos,
      'Molhos/Acompanhamentos',
    );
    const recipe = await upsertRecipe({
      slug: 'it-009-recipe-detail-no-ratings',
      categoryId: category.id,
    });
    await addIngredientAndStep(recipe.id);

    const response = await getBySlug('it-009-recipe-detail-no-ratings').expect(
      200,
    );
    const body = response.body as RecipeDetailBody;

    expect(body.averageRating).toBeNull();
    expect(body.ratingCount).toBe(0);
  });
});
