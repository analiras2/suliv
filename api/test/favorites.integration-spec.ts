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

interface FavoritesListBody {
  items: { id: string; slug: string }[];
  nextCursor: string | null;
}

describe('GET/POST /favorites, DELETE /favorites/:recipe_id (integration)', () => {
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

  function postFavorite(userId: string, recipeId: string) {
    return request(app.getHttpServer())
      .post('/favorites')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({ recipe_id: recipeId });
  }

  function getFavorites(userId: string) {
    return request(app.getHttpServer())
      .get('/favorites')
      .set('Authorization', `Bearer ${tokenFor(userId)}`);
  }

  function deleteFavorite(userId: string, recipeId: string) {
    return request(app.getHttpServer())
      .delete(`/favorites/${recipeId}`)
      .set('Authorization', `Bearer ${tokenFor(userId)}`);
  }

  it('IT-005 POST /favorites then GET /favorites reflects the addition', async () => {
    const category = await upsertCategory(RecipeCategory.lanche, 'Lanche');
    const recipe = await upsertRecipe('it-005-favorite-add', category.id);
    const user = 'it-005-favorites-user';

    const postResponse = await postFavorite(user, recipe.id);
    expect([200, 201]).toContain(postResponse.status);

    const listResponse = await getFavorites(user).expect(200);
    const body = listResponse.body as FavoritesListBody;
    expect(body.items.map((item) => item.id)).toContain(recipe.id);
  });

  it('IT-006 DELETE /favorites/:recipe_id then GET /favorites no longer includes it', async () => {
    const category = await upsertCategory(
      RecipeCategory.sobremesa,
      'Sobremesa',
    );
    const recipe = await upsertRecipe('it-006-favorite-remove', category.id);
    const user = 'it-006-favorites-user';

    await postFavorite(user, recipe.id);
    await getFavorites(user).expect(200);

    const deleteResponse = await deleteFavorite(user, recipe.id);
    expect(deleteResponse.status).toBe(200);

    const listResponse = await getFavorites(user).expect(200);
    const body = listResponse.body as FavoritesListBody;
    expect(body.items.map((item) => item.id)).not.toContain(recipe.id);
  });
});
