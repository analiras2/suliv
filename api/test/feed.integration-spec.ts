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

  it('IT-002 GET /feed for a vegano user never ranks a diet-incompatible recipe ahead of a compatible one', async () => {
    await onboard('user-2', 'vegano');

    const response = await request(app.getHttpServer())
      .get('/feed')
      .set('Authorization', `Bearer ${tokenFor('user-2')}`)
      .expect(200);

    // docs/02-prd.md §8.4/§9.3: diet preference is a soft, non-exclusionary
    // score signal (task_03) — it is not guaranteed that every recipe is
    // vegano, only that compatible recipes never rank behind incompatible ones.
    const body = response.body as FeedResponseBody;
    expect(body.selectedForYou.length).toBeGreaterThan(0);
    const lastCompatibleIndex = body.selectedForYou.reduce(
      (lastIndex, recipe, index) =>
        recipe.dietPreference === 'vegano' ? index : lastIndex,
      -1,
    );
    const firstIncompatibleIndex = body.selectedForYou.findIndex(
      (recipe) => recipe.dietPreference !== 'vegano',
    );
    if (firstIncompatibleIndex !== -1) {
      expect(lastCompatibleIndex).toBeLessThan(firstIncompatibleIndex);
    }
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
});
