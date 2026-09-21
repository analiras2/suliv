import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { generateKeyPairSync } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

const ISSUER_PATH = '/auth/v1';
const SEEDED_CATEGORY_COUNT = 6;

interface RecipeSummaryResponseBody {
  id: string;
  dietPreference: string;
}

interface CategoryResponseBody {
  id: string;
  key: string;
  label: string;
}

interface FeedResponseBody {
  selectedForYou: RecipeSummaryResponseBody[];
  categories: {
    category: CategoryResponseBody;
    recipes: RecipeSummaryResponseBody[];
  }[];
  topOfWeek: RecipeSummaryResponseBody[];
  catalogEmpty: boolean;
}

describe('Feed (integration)', () => {
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

  beforeEach(async () => {
    jest.clearAllMocks();
    supabaseAdmin.deleteUser.mockResolvedValue(undefined);
    await prisma.userAllergy.deleteMany();
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

  // Runs `fn` against a catalog with zero `aprovada` recipes by temporarily
  // demoting every currently-approved recipe (from prisma/seed.ts), then
  // restores them regardless of outcome (estados-erro-empty-states IT-001/IT-002).
  async function withEmptyCatalog<T>(fn: () => Promise<T>): Promise<T> {
    const approved = await prisma.recipe.findMany({
      where: { status: 'aprovada' },
      select: { id: true },
    });
    const approvedIds = approved.map((recipe) => recipe.id);
    await prisma.recipe.updateMany({
      where: { id: { in: approvedIds } },
      data: { status: 'em_analise' },
    });
    try {
      return await fn();
    } finally {
      await prisma.recipe.updateMany({
        where: { id: { in: approvedIds } },
        data: { status: 'aprovada' },
      });
    }
  }

  function bootstrap(userId: string) {
    return request(app.getHttpServer())
      .post('/me/bootstrap')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({});
  }

  async function onboard(
    userId: string,
    dietPreference: 'vegano' | 'vegetariano' | 'flexitariano',
  ): Promise<void> {
    await bootstrap(userId).expect(201);
    await request(app.getHttpServer())
      .post('/me/onboarding')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({
        diet_preference: dietPreference,
        allergen_ids: [],
        new_terms: [],
        cooking_level: 'iniciante',
        cooking_frequency: 'raramente',
      })
      .expect(201);
  }

  it('IT-001 GET /feed returns the correct shape and sizes for an authenticated onboarded user', async () => {
    await onboard('user-1', 'flexitariano');

    const response = await request(app.getHttpServer())
      .get('/feed')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(200);

    const body = response.body as FeedResponseBody;
    expect(body.selectedForYou.length).toBeLessThanOrEqual(5);
    expect(body.topOfWeek.length).toBeLessThanOrEqual(5);
    expect(body.categories).toHaveLength(SEEDED_CATEGORY_COUNT);
    for (const block of body.categories) {
      expect(block.recipes.length).toBeGreaterThan(0);
    }
  });

  it('IT-002 GET /feed includes a diet-compatible recipe for a vegano user', async () => {
    await onboard('user-2', 'vegano');

    const response = await request(app.getHttpServer())
      .get('/feed')
      .set('Authorization', `Bearer ${tokenFor('user-2')}`)
      .expect(200);

    // Diet is a soft, non-exclusionary scoring signal. The feed can include
    // incompatible recipes, but must retain compatible choices when they exist.
    const body = response.body as FeedResponseBody;
    expect(body.selectedForYou.length).toBeGreaterThan(0);
    expect(
      body.selectedForYou.some((recipe) => recipe.dietPreference === 'vegano'),
    ).toBe(true);
  });

  it('IT-003 GET /feed without a valid JWT returns 401', async () => {
    await request(app.getHttpServer()).get('/feed').expect(401);
  });

  it('IT-004 GET /categories returns exactly the 6 seeded categories', async () => {
    await bootstrap('user-3').expect(201);

    const response = await request(app.getHttpServer())
      .get('/categories')
      .set('Authorization', `Bearer ${tokenFor('user-3')}`)
      .expect(200);

    const body = response.body as CategoryResponseBody[];
    expect(body).toHaveLength(SEEDED_CATEGORY_COUNT);
    expect(new Set(body.map((category) => category.key)).size).toBe(
      SEEDED_CATEGORY_COUNT,
    );
  });

  // estados-erro-empty-states: catalogEmpty signal (ADR-002)
  it('IT-001 GET /feed against a zero-approved-recipe catalog returns catalogEmpty: true alongside empty blocks', async () => {
    await onboard('user-4', 'flexitariano');

    await withEmptyCatalog(async () => {
      const response = await request(app.getHttpServer())
        .get('/feed')
        .set('Authorization', `Bearer ${tokenFor('user-4')}`)
        .expect(200);

      const body = response.body as FeedResponseBody;
      expect(body.catalogEmpty).toBe(true);
      expect(body.selectedForYou).toHaveLength(0);
      expect(body.topOfWeek).toHaveLength(0);
      for (const block of body.categories) {
        expect(block.recipes).toHaveLength(0);
      }
    });
  });

  it('IT-002 GET /feed with exactly one approved recipe returns catalogEmpty: false and surfaces it via the cold-start slot', async () => {
    await onboard('user-5', 'flexitariano');

    await withEmptyCatalog(async () => {
      const category = await prisma.category.findFirstOrThrow();
      const recipe = await prisma.recipe.upsert({
        where: { slug: 'it-002-catalogempty-fixture' },
        update: { status: 'aprovada', approvedAt: new Date() },
        create: {
          slug: 'it-002-catalogempty-fixture',
          title: 'IT-002 fixture',
          description: 'Fixture recipe for the catalogEmpty cold-start test',
          categoryId: category.id,
          prepTimeMinutes: 10,
          timeBucket: 'ate_15',
          servings: 1,
          difficulty: 'iniciante',
          dietPreference: 'vegano',
          status: 'aprovada',
          approvedAt: new Date(),
        },
      });

      try {
        const response = await request(app.getHttpServer())
          .get('/feed')
          .set('Authorization', `Bearer ${tokenFor('user-5')}`)
          .expect(200);

        const body = response.body as FeedResponseBody;
        expect(body.catalogEmpty).toBe(false);
        expect(body.selectedForYou.some((item) => item.id === recipe.id)).toBe(
          true,
        );
      } finally {
        await prisma.recipe.delete({ where: { id: recipe.id } });
      }
    });
  });
});
