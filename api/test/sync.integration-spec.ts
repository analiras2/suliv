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

interface SyncResponseBody {
  appliedCount: number;
  rejectedTypes: string[];
}

describe('POST /sync (integration)', () => {
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

  async function upsertCategory(key: RecipeCategory, label: string) {
    return prisma.category.upsert({
      where: { key },
      update: {},
      create: { key, label },
    });
  }

  async function upsertRecipe(slug: string, categoryId: string) {
    const shared = {
      title: slug,
      description: `Fixture recipe for ${slug}`,
      categoryId,
      prepTimeMinutes: 10,
      timeBucket: 'ate_15' as const,
      servings: 4,
      difficulty: 'iniciante' as const,
      dietPreference: 'flexitariano' as const,
      status: 'aprovada' as const,
      approvedAt: new Date(),
    };
    return prisma.recipe.upsert({
      where: { slug },
      update: shared,
      create: { slug, ...shared },
    });
  }

  function postSync(userId: string, actions: Record<string, unknown>[]) {
    return request(app.getHttpServer())
      .post('/sync')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({ actions });
  }

  function favoriteAddAction(recipeId: string, idempotencyKey: string) {
    return {
      type: 'favorite_add',
      payload: { recipeId, occurredAt: new Date().toISOString() },
      idempotency_key: idempotencyKey,
    };
  }

  function favoriteRemoveAction(recipeId: string, idempotencyKey: string) {
    return {
      type: 'favorite_remove',
      payload: { recipeId, occurredAt: new Date().toISOString() },
      idempotency_key: idempotencyKey,
    };
  }

  it('IT-001 a favorite_add action creates the Favorite row and increments stats', async () => {
    const category = await upsertCategory(RecipeCategory.lanche, 'Lanche');
    const recipe = await upsertRecipe('it-001-sync-add', category.id);
    const user = 'it-001-sync-user';

    const response = await postSync(user, [
      favoriteAddAction(recipe.id, 'it-001-key'),
    ]);

    expect(response.status).toBe(200);
    const body = response.body as SyncResponseBody;
    expect(body).toEqual({ appliedCount: 1, rejectedTypes: [] });

    const favorite = await prisma.favorite.findUnique({
      where: { userId_recipeId: { userId: user, recipeId: recipe.id } },
    });
    expect(favorite).not.toBeNull();

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const stats = await prisma.recipeDailyStats.findUnique({
      where: { recipeId_date: { recipeId: recipe.id, date: today } },
    });
    expect(stats?.favoritesAdded).toBeGreaterThanOrEqual(1);
  });

  it('IT-002 a favorite_remove action deletes the Favorite row', async () => {
    const category = await upsertCategory(
      RecipeCategory.sobremesa,
      'Sobremesa',
    );
    const recipe = await upsertRecipe('it-002-sync-remove', category.id);
    const user = 'it-002-sync-user';

    await postSync(user, [
      favoriteAddAction(recipe.id, 'it-002-key-add'),
    ]).expect(200);

    const response = await postSync(user, [
      favoriteRemoveAction(recipe.id, 'it-002-key-remove'),
    ]);

    expect(response.status).toBe(200);
    const body = response.body as SyncResponseBody;
    expect(body).toEqual({ appliedCount: 1, rejectedTypes: [] });

    const favorite = await prisma.favorite.findUnique({
      where: { userId_recipeId: { userId: user, recipeId: recipe.id } },
    });
    expect(favorite).toBeNull();
  });

  it('IT-003 resubmitting the same idempotency_key creates no second row', async () => {
    const category = await upsertCategory(RecipeCategory.bebida, 'Bebida');
    const recipe = await upsertRecipe('it-003-sync-replay', category.id);
    const user = 'it-003-sync-user';

    await postSync(user, [favoriteAddAction(recipe.id, 'it-003-key')]).expect(
      200,
    );
    const replay = await postSync(user, [
      favoriteAddAction(recipe.id, 'it-003-key'),
    ]);

    expect(replay.status).toBe(200);
    const favoriteCount = await prisma.favorite.count({
      where: { userId: user, recipeId: recipe.id },
    });
    expect(favoriteCount).toBe(1);
    const syncOpCount = await prisma.syncOperation.count({
      where: { userId: user, idempotencyKey: 'it-003-key' },
    });
    expect(syncOpCount).toBe(1);
  });

  it('IT-004 a mixed valid/unrecognized batch applies the valid action and reports the rejection', async () => {
    const category = await upsertCategory(
      RecipeCategory.molhos_acompanhamentos,
      'Molhos/Acompanhamentos',
    );
    const recipe = await upsertRecipe('it-004-sync-mixed', category.id);
    const user = 'it-004-sync-user';

    const response = await postSync(user, [
      favoriteAddAction(recipe.id, 'it-004-key'),
      {
        type: 'unknown_type',
        payload: { foo: 'bar' },
        idempotency_key: 'it-004-key-unknown',
      },
    ]);

    expect(response.status).toBe(200);
    const body = response.body as SyncResponseBody;
    expect(body.appliedCount).toBe(1);
    expect(body.rejectedTypes).toContain('unknown_type');

    const favorite = await prisma.favorite.findUnique({
      where: { userId_recipeId: { userId: user, recipeId: recipe.id } },
    });
    expect(favorite).not.toBeNull();
  });
});
