import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, RecipeCategory } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('Admin editorial boost (integration)', () => {
  const prisma = new PrismaClient();
  const trustedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const supabaseAdmin = { deleteUser: jest.fn<Promise<void>, [string]>() };
  let app: INestApplication<App>;
  let jwksServer: Server;
  let adminToken: string;

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

    const adminEmail = `admin-editorial-boost-${randomUUID()}@example.com`;
    await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash: hashSync('correct-password', 10),
        role: 'moderator',
      },
    });
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

  async function upsertCategory(key: RecipeCategory, label: string) {
    return prisma.category.upsert({
      where: { key },
      update: {},
      create: { key, label },
    });
  }

  async function seedRecipe(slug: string, categoryId: string) {
    const authorId = `boost-author-${randomUUID()}`;
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
        status: 'aprovada',
      },
    });
  }

  it('IT-016 create with valid dates subsequently appears in GET /admin/boosts', async () => {
    const category = await upsertCategory(RecipeCategory.lanche, 'Lanche');
    const recipe = await seedRecipe(`it-016-${randomUUID()}`, category.id);
    const startsAt = new Date(Date.now() + MS_PER_DAY);
    const endsAt = new Date(Date.now() + 5 * MS_PER_DAY);

    const createResponse = await request(app.getHttpServer())
      .post('/admin/boosts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recipe_id: recipe.id,
        weight: 15,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .expect(201);
    expect((createResponse.body as { id: string }).id).toBeDefined();

    const listResponse = await request(app.getHttpServer())
      .get('/admin/boosts')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const body = listResponse.body as Array<{ recipeId: string }>;
    expect(body.some((item) => item.recipeId === recipe.id)).toBe(true);
  });

  it('IT-017 create with ends_at before starts_at rejects, no row created', async () => {
    const category = await upsertCategory(RecipeCategory.bebida, 'Bebida');
    const recipe = await seedRecipe(`it-017-${randomUUID()}`, category.id);
    const startsAt = new Date(Date.now() + 5 * MS_PER_DAY);
    const endsAt = new Date(Date.now() + MS_PER_DAY);

    await request(app.getHttpServer())
      .post('/admin/boosts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recipe_id: recipe.id,
        weight: 15,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .expect(400);

    const count = await prisma.editorialBoost.count({
      where: { recipeId: recipe.id },
    });
    expect(count).toBe(0);
  });

  it('IT-018 GET /admin/boosts computes upcoming/active/expired correctly', async () => {
    const category = await upsertCategory(
      RecipeCategory.sobremesa,
      'Sobremesa',
    );
    const pastRecipe = await seedRecipe(
      `it-018-past-${randomUUID()}`,
      category.id,
    );
    const activeRecipe = await seedRecipe(
      `it-018-active-${randomUUID()}`,
      category.id,
    );
    const futureRecipe = await seedRecipe(
      `it-018-future-${randomUUID()}`,
      category.id,
    );

    const pastBoost = await prisma.editorialBoost.create({
      data: {
        recipeId: pastRecipe.id,
        weight: 5,
        startsAt: new Date(Date.now() - 10 * MS_PER_DAY),
        endsAt: new Date(Date.now() - 5 * MS_PER_DAY),
      },
    });
    const activeBoost = await prisma.editorialBoost.create({
      data: {
        recipeId: activeRecipe.id,
        weight: 5,
        startsAt: new Date(Date.now() - MS_PER_DAY),
        endsAt: new Date(Date.now() + MS_PER_DAY),
      },
    });
    const futureBoost = await prisma.editorialBoost.create({
      data: {
        recipeId: futureRecipe.id,
        weight: 5,
        startsAt: new Date(Date.now() + 5 * MS_PER_DAY),
        endsAt: new Date(Date.now() + 10 * MS_PER_DAY),
      },
    });

    const response = await request(app.getHttpServer())
      .get('/admin/boosts')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const body = response.body as Array<{ id: string; status: string }>;

    expect(body.find((item) => item.id === pastBoost.id)?.status).toBe(
      'expired',
    );
    expect(body.find((item) => item.id === activeBoost.id)?.status).toBe(
      'active',
    );
    expect(body.find((item) => item.id === futureBoost.id)?.status).toBe(
      'upcoming',
    );
  });
});
