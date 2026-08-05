import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, RecipeCategory } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { NotificationsService } from '../src/notifications/notifications.service';
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

const ISSUER_PATH = '/auth/v1';

describe('Admin recipe moderation (integration)', () => {
  const prisma = new PrismaClient();
  const trustedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const supabaseAdmin = { deleteUser: jest.fn<Promise<void>, [string]>() };
  const notificationsSend = jest
    .fn<Promise<void>, [string, string, Record<string, unknown>]>()
    .mockResolvedValue(undefined);
  let app: INestApplication<App>;
  let jwksServer: Server;
  let issuer: string;
  let adminToken: string;
  let adminId: string;

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
      .overrideProvider(NotificationsService)
      .useValue({ send: notificationsSend })
      .compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ forbidNonWhitelisted: true, whitelist: true }),
    );
    await app.init();

    const adminEmail = `admin-recipe-moderation-${randomUUID()}@example.com`;
    const admin = await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash: hashSync('correct-password', 10),
        role: 'moderator',
      },
    });
    adminId = admin.id;
    const loginResponse = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email: adminEmail, password: 'correct-password' })
      .expect(200);
    adminToken = (loginResponse.body as { token: string }).token;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    await new Promise<void>((resolve, reject) =>
      jwksServer.close((error) => (error ? reject(error) : resolve())),
    );
  });

  beforeEach(() => {
    notificationsSend.mockClear();
  });

  function tokenFor(userId: string, email = `${userId}@example.com`): string {
    return sign({ sub: userId, email }, trustedKeys.privateKey, {
      algorithm: 'RS256',
      expiresIn: '5m',
      issuer,
      keyid: 'trusted-key',
    });
  }

  async function onboard(userId: string): Promise<void> {
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
        allergen_ids: [],
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

  async function seedRecipe(
    slug: string,
    categoryId: string,
    authorId: string,
    overrides: Partial<{
      status: 'em_analise' | 'aprovada';
      authorMessageToModerator: string;
    }> = {},
  ) {
    return prisma.recipe.create({
      data: {
        slug,
        authorId,
        title: slug,
        description: `Fixture recipe for ${slug}`,
        categoryId,
        prepTimeMinutes: 20,
        timeBucket: 'quinze_30',
        servings: 4,
        difficulty: 'iniciante',
        dietPreference: 'flexitariano',
        status: overrides.status ?? 'em_analise',
        submittedAt: new Date(),
        authorMessageToModerator: overrides.authorMessageToModerator,
        ingredients: {
          create: [
            {
              name: 'Farinha',
              quantity: 2,
              unit: 'xicara',
              scalesWithServings: true,
              order: 0,
            },
          ],
        },
        steps: {
          create: [
            { order: 0, description: 'Misture tudo', stepTimeSeconds: 60 },
          ],
        },
      },
    });
  }

  it('IT-006 GET /admin/recipes/:id returns full content for an em_analise recipe', async () => {
    const category = await upsertCategory(
      RecipeCategory.sobremesa,
      'Sobremesa',
    );
    const author = `it-006-author-${randomUUID()}`;
    await onboard(author);
    const recipe = await seedRecipe(
      `it-006-recipe-${randomUUID()}`,
      category.id,
      author,
      {
        authorMessageToModerator: 'Por favor revisar o tempo de forno',
      },
    );

    const response = await request(app.getHttpServer())
      .get(`/admin/recipes/${recipe.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: recipe.id,
      status: 'em_analise',
      authorMessageToModerator: 'Por favor revisar o tempo de forno',
      ingredients: [expect.objectContaining({ name: 'Farinha' })],
      steps: [expect.objectContaining({ description: 'Misture tudo' })],
    });
  });

  it('IT-007 approve makes the recipe subsequently appear in GET /recipes/search', async () => {
    const category = await upsertCategory(RecipeCategory.lanche, 'Lanche');
    const author = `it-007-author-${randomUUID()}`;
    await onboard(author);
    const searchWord = `zzzpudimit007${randomUUID().replace(/-/g, '')}`;
    const recipe = await seedRecipe(searchWord, category.id, author);

    await request(app.getHttpServer())
      .post(`/admin/recipes/${recipe.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const updated = await prisma.recipe.findUniqueOrThrow({
      where: { id: recipe.id },
    });
    expect(updated.status).toBe('aprovada');
    expect(updated.approvedAt).not.toBeNull();

    const searchResponse = await request(app.getHttpServer())
      .get('/recipes/search')
      .query({ q: searchWord })
      .set('Authorization', `Bearer ${tokenFor(author)}`)
      .expect(200);

    const body = searchResponse.body as { items: Array<{ id: string }> };
    expect(body.items.some((item) => item.id === recipe.id)).toBe(true);
  });

  it('IT-008 approve triggers a mocked FCM send to the author', async () => {
    const category = await upsertCategory(RecipeCategory.bebida, 'Bebida');
    const author = `it-008-author-${randomUUID()}`;
    await onboard(author);
    const recipe = await seedRecipe(
      `it-008-recipe-${randomUUID()}`,
      category.id,
      author,
    );

    await request(app.getHttpServer())
      .post(`/admin/recipes/${recipe.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(notificationsSend).toHaveBeenCalledWith(
      author,
      'recipe_approved',
      expect.objectContaining({ recipeTitle: recipe.title }),
    );
  });

  it('IT-009 request-adjustment reflects precisa_de_ajustes with the reason in GET /me/recipes', async () => {
    const category = await upsertCategory(
      RecipeCategory.molhos_acompanhamentos,
      'Molhos e Acompanhamentos',
    );
    const author = `it-009-author-${randomUUID()}`;
    await onboard(author);
    const recipe = await seedRecipe(
      `it-009-recipe-${randomUUID()}`,
      category.id,
      author,
    );

    await request(app.getHttpServer())
      .post(`/admin/recipes/${recipe.id}/request-adjustment`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'passo_confuso', note: 'texto' })
      .expect(200);

    const myRecipesResponse = await request(app.getHttpServer())
      .get('/me/recipes')
      .query({ status: 'precisa_de_ajustes' })
      .set('Authorization', `Bearer ${tokenFor(author)}`)
      .expect(200);
    const body = myRecipesResponse.body as {
      items: Array<{ id: string; status: string }>;
    };
    expect(
      body.items.some(
        (item) => item.id === recipe.id && item.status === 'precisa_de_ajustes',
      ),
    ).toBe(true);

    // MyRecipeSummaryDto (criacao-envio-receitas, out of this task's scope)
    // doesn't expose adjustmentReason/adjustmentNote on the list endpoint;
    // confirm the reason/note directly against the row it wrote.
    const updated = await prisma.recipe.findUniqueOrThrow({
      where: { id: recipe.id },
    });
    expect(updated.adjustmentReason).toBe('passo_confuso');
    expect(updated.adjustmentNote).toBe('texto');
  });

  it('IT-020 approve produces a structured audit log entry with adminId, action, targetId', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const category = await upsertCategory(
      RecipeCategory.cafe_da_manha,
      'Café da Manhã',
    );
    const author = `it-020-author-${randomUUID()}`;
    await onboard(author);
    const recipe = await seedRecipe(
      `it-020-recipe-${randomUUID()}`,
      category.id,
      author,
    );

    await request(app.getHttpServer())
      .post(`/admin/recipes/${recipe.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId,
        action: 'approve',
        targetId: recipe.id,
      }),
    );

    logSpy.mockRestore();
  });
});
