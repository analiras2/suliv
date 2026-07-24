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

describe('Recipe authoring API + draft_upsert (integration)', () => {
  const prisma = new PrismaClient();
  const trustedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const supabaseAdmin = { deleteUser: jest.fn<Promise<void>, [string]>() };
  let app: INestApplication<App>;
  let jwksServer: Server;
  let issuer: string;
  let categoryId: string;

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

    const category = await prisma.category.upsert({
      where: { key: RecipeCategory.almoco_jantar },
      update: {},
      create: { key: RecipeCategory.almoco_jantar, label: 'Almoço/Jantar' },
    });
    categoryId = category.id;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    supabaseAdmin.deleteUser.mockResolvedValue(undefined);
    await prisma.recipeVersion.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.recipeIngredient.deleteMany();
    await prisma.recipeStep.deleteMany();
    await prisma.syncOperation.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.user.deleteMany();
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

  async function bootstrapUser(userId: string, termsVersion?: string) {
    await request(app.getHttpServer())
      .post('/me/bootstrap')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({ name: 'Autor' })
      .expect(201);
    if (termsVersion) {
      await request(app.getHttpServer())
        .post('/me/terms-acceptance')
        .set('Authorization', `Bearer ${tokenFor(userId)}`)
        .send({ termsVersion })
        .expect(200);
    }
  }

  function draftPayload(overrides: Record<string, unknown> = {}) {
    return {
      id: 'a0000000-0000-4000-8000-000000000001',
      title: 'Panqueca de banana',
      description: 'Panquecas fofinhas de banana.',
      categoryId,
      prepTimeMinutes: 15,
      servings: 2,
      difficulty: 'iniciante',
      dietPreference: 'vegano',
      ingredients: [
        {
          name: 'Banana',
          quantity: 2,
          unit: 'unidade',
          scalesWithServings: true,
          order: 1,
        },
      ],
      steps: [
        { order: 1, description: 'Amasse as bananas.', stepTimeSeconds: 60 },
      ],
      ...overrides,
    };
  }

  async function seedApprovedRecipe(authorId: string) {
    return prisma.recipe.create({
      data: {
        authorId,
        title: 'Receita aprovada',
        slug: `receita-aprovada-${Date.now()}`,
        description: 'Uma receita já aprovada.',
        categoryId,
        prepTimeMinutes: 20,
        timeBucket: 'quinze_30',
        servings: 2,
        difficulty: 'iniciante',
        dietPreference: 'flexitariano',
        status: 'aprovada',
        currentVersion: 1,
        approvedAt: new Date(),
      },
    });
  }

  it('IT-001 POST /sync draft_upsert creates a Recipe for a never-before-seen id', async () => {
    await bootstrapUser('user-1');

    await request(app.getHttpServer())
      .post('/sync')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({
        actions: [
          {
            type: 'draft_upsert',
            payload: draftPayload(),
            idempotency_key: 'sync-key-1',
          },
        ],
      })
      .expect(201);

    const recipe = await prisma.recipe.findUnique({
      where: { id: 'a0000000-0000-4000-8000-000000000001' },
    });
    expect(recipe).toEqual(
      expect.objectContaining({ status: 'rascunho', authorId: 'user-1' }),
    );
  });

  it('IT-002 a second draft_upsert for the same recipeId replaces ingredients with no leftover rows', async () => {
    await bootstrapUser('user-1');
    const recipeId = 'a0000000-0000-4000-8000-000000000002';

    await request(app.getHttpServer())
      .post('/sync')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({
        actions: [
          {
            type: 'draft_upsert',
            payload: draftPayload({ id: recipeId }),
            idempotency_key: 'sync-key-2a',
          },
        ],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/sync')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({
        actions: [
          {
            type: 'draft_upsert',
            payload: draftPayload({
              id: recipeId,
              ingredients: [
                {
                  name: 'Aveia',
                  quantity: 1,
                  unit: 'xicara',
                  scalesWithServings: true,
                  order: 1,
                },
              ],
            }),
            idempotency_key: 'sync-key-2b',
          },
        ],
      })
      .expect(201);

    const ingredients = await prisma.recipeIngredient.findMany({
      where: { recipeId },
    });
    expect(ingredients).toHaveLength(1);
    expect(ingredients[0].name).toBe('Aveia');
  });

  it('IT-004 rejects submit without a cover image, then succeeds once one is set and terms accepted', async () => {
    await bootstrapUser('user-1', 'v1');
    const created = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send(draftPayload({ id: 'a0000000-0000-4000-8000-000000000004' }))
      .expect(201);
    const recipeId = (created.body as { id: string }).id;

    await request(app.getHttpServer())
      .post(`/recipes/${recipeId}/submit`)
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(422);

    await request(app.getHttpServer())
      .patch(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({ coverImageUrl: 'https://img/cover.jpg' })
      .expect(200);

    const submitted = await request(app.getHttpServer())
      .post(`/recipes/${recipeId}/submit`)
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(200);

    expect((submitted.body as { status: string }).status).toBe('em_analise');
  });

  it('IT-005 429s the 6th submission in the same day', async () => {
    await bootstrapUser('user-1', 'v1');

    for (let index = 0; index < 5; index += 1) {
      const created = await request(app.getHttpServer())
        .post('/recipes')
        .set('Authorization', `Bearer ${tokenFor('user-1')}`)
        .send(
          draftPayload({
            id: `b000000${index}-0000-4000-8000-000000000100`,
          }),
        )
        .expect(201);
      const recipeId = (created.body as { id: string }).id;
      await request(app.getHttpServer())
        .patch(`/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${tokenFor('user-1')}`)
        .send({ coverImageUrl: 'https://img/cover.jpg' })
        .expect(200);
      await request(app.getHttpServer())
        .post(`/recipes/${recipeId}/submit`)
        .set('Authorization', `Bearer ${tokenFor('user-1')}`)
        .expect(200);
    }

    const sixth = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send(draftPayload({ id: 'a0000000-0000-4000-8000-000000000199' }))
      .expect(201);
    const sixthId = (sixth.body as { id: string }).id;
    await request(app.getHttpServer())
      .patch(`/recipes/${sixthId}`)
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({ coverImageUrl: 'https://img/cover.jpg' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/recipes/${sixthId}/submit`)
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(429);
  });

  it('IT-006/IT-007 editing an aprovada recipe snapshots a version, re-enters moderation, and drops out of search', async () => {
    await bootstrapUser('user-1', 'v1');
    const recipe = await seedApprovedRecipe('user-1');

    const response = await request(app.getHttpServer())
      .patch(`/recipes/${recipe.id}`)
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({ title: 'Receita aprovada (revisada)' })
      .expect(200);

    expect((response.body as { status: string }).status).toBe('em_analise');

    const versions = await prisma.recipeVersion.findMany({
      where: { recipeId: recipe.id },
    });
    expect(versions).toHaveLength(1);
    expect(versions[0].versionNumber).toBe(1);

    const updated = await prisma.recipe.findUniqueOrThrow({
      where: { id: recipe.id },
    });
    expect(updated.currentVersion).toBe(2);

    const searchResponse = await request(app.getHttpServer())
      .get('/recipes/search')
      .query({ q: 'Receita aprovada' })
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(200);
    const searchBody = searchResponse.body as { items?: { id: string }[] };
    expect((searchBody.items ?? []).some((item) => item.id === recipe.id)).toBe(
      false,
    );
  });

  it('IT-008 editing a rascunho never creates a recipe_versions row', async () => {
    await bootstrapUser('user-1', 'v1');
    const created = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send(draftPayload({ id: 'a0000000-0000-4000-8000-000000000008' }))
      .expect(201);
    const recipeId = (created.body as { id: string }).id;

    await request(app.getHttpServer())
      .patch(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({ title: 'Panqueca revisada' })
      .expect(200);

    const versions = await prisma.recipeVersion.findMany({
      where: { recipeId },
    });
    expect(versions).toHaveLength(0);
    const recipe = await prisma.recipe.findUniqueOrThrow({
      where: { id: recipeId },
    });
    expect(recipe.currentVersion).toBe(1);
    expect(recipe.status).toBe('rascunho');
  });

  it('IT-009/IT-010 delete previews favoritesCount, then soft-deletes on confirm', async () => {
    await bootstrapUser('user-1', 'v1');
    await bootstrapUser('user-2');
    const recipe = await seedApprovedRecipe('user-1');
    await prisma.favorite.createMany({
      data: [
        { userId: 'user-1', recipeId: recipe.id },
        { userId: 'user-2', recipeId: recipe.id },
      ],
    });

    const preview = await request(app.getHttpServer())
      .delete(`/recipes/${recipe.id}`)
      .query({ confirm: 'false' })
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(200);
    expect((preview.body as { favoritesCount: number }).favoritesCount).toBe(2);

    const unchanged = await prisma.recipe.findUniqueOrThrow({
      where: { id: recipe.id },
    });
    expect(unchanged.status).toBe('aprovada');

    await request(app.getHttpServer())
      .delete(`/recipes/${recipe.id}`)
      .query({ confirm: 'true' })
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(200);

    const deleted = await prisma.recipe.findUniqueOrThrow({
      where: { id: recipe.id },
    });
    expect(deleted.status).toBe('removida');
    expect(deleted.removedAt).not.toBeNull();
  });

  it('IT-011 GET /me/recipes filters by status and paginates unfiltered results', async () => {
    await bootstrapUser('user-1', 'v1');
    const approved = await seedApprovedRecipe('user-1');
    await prisma.recipe.update({
      where: { id: approved.id },
      data: { status: 'aprovada' },
    });
    await prisma.recipe.create({
      data: {
        authorId: 'user-1',
        title: 'Rascunho',
        slug: `rascunho-${Date.now()}`,
        description: 'Em progresso.',
        categoryId,
        prepTimeMinutes: 10,
        timeBucket: 'ate_15',
        servings: 1,
        difficulty: 'iniciante',
        dietPreference: 'vegano',
        status: 'rascunho',
      },
    });
    await prisma.recipe.create({
      data: {
        authorId: 'user-1',
        title: 'Em análise',
        slug: `em-analise-${Date.now()}`,
        description: 'Enviada.',
        categoryId,
        prepTimeMinutes: 10,
        timeBucket: 'ate_15',
        servings: 1,
        difficulty: 'iniciante',
        dietPreference: 'vegano',
        status: 'em_analise',
        submittedAt: new Date(),
      },
    });
    await prisma.recipe.create({
      data: {
        authorId: 'user-1',
        title: 'Precisa de ajustes',
        slug: `ajustes-${Date.now()}`,
        description: 'Devolvida.',
        categoryId,
        prepTimeMinutes: 10,
        timeBucket: 'ate_15',
        servings: 1,
        difficulty: 'iniciante',
        dietPreference: 'vegano',
        status: 'precisa_de_ajustes',
      },
    });

    const filtered = await request(app.getHttpServer())
      .get('/me/recipes')
      .query({ status: 'aprovada' })
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(200);
    const filteredBody = filtered.body as { items: { status: string }[] };
    expect(filteredBody.items).toHaveLength(1);
    expect(filteredBody.items[0].status).toBe('aprovada');

    const unfiltered = await request(app.getHttpServer())
      .get('/me/recipes')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(200);
    const unfilteredBody = unfiltered.body as {
      items: { status: string }[];
      nextCursor: string | null;
    };
    expect(unfilteredBody.items).toHaveLength(4);
    expect(unfilteredBody.nextCursor).toBeNull();
  });

  it('rejects PATCH/submit/delete for a recipe the caller does not own', async () => {
    await bootstrapUser('user-1', 'v1');
    await bootstrapUser('user-2', 'v1');
    const recipe = await seedApprovedRecipe('user-1');

    await request(app.getHttpServer())
      .patch(`/recipes/${recipe.id}`)
      .set('Authorization', `Bearer ${tokenFor('user-2')}`)
      .send({ title: 'Tentativa alheia' })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/recipes/${recipe.id}/submit`)
      .set('Authorization', `Bearer ${tokenFor('user-2')}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/recipes/${recipe.id}`)
      .query({ confirm: 'false' })
      .set('Authorization', `Bearer ${tokenFor('user-2')}`)
      .expect(403);
  });

  it.each([
    ['post', '/recipes'],
    ['get', '/me/recipes'],
  ] as const)('guards %s %s without authorization', async (method, path) => {
    await request(app.getHttpServer())[method](path).expect(401);
  });
});
