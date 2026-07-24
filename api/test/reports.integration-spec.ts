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

describe('POST /reports (integration)', () => {
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

  function report(
    userId: string,
    body: {
      target_type: string;
      target_id: string;
      reason: string;
      free_text?: string;
    },
  ) {
    return request(app.getHttpServer())
      .post('/reports')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send(body);
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

  async function seedComment(recipeId: string, userId: string) {
    return prisma.commentRating.upsert({
      where: { recipeId_userId: { recipeId, userId } },
      update: {},
      create: { recipeId, userId, rating: 3 },
    });
  }

  it('IT-006 a created report is visible to a direct read of the reports table', async () => {
    // painel-administrativo-moderacao's GET /admin/reports?status=pending is
    // not implemented in this codebase snapshot (out of this task's scope);
    // this verifies the same underlying row painel-administrativo-moderacao
    // documents reading, since the admin endpoint itself belongs to that
    // feature's own suite.
    const category = await upsertCategory(RecipeCategory.lanche, 'Lanche');
    const recipe = await upsertRecipe('it-006-reports-recipe', category.id);
    const author = 'it-006-reports-author';
    const reporter = 'it-006-reports-reporter';
    await onboard(author);
    await onboard(reporter);
    const comment = await seedComment(recipe.id, author);

    const response = await report(reporter, {
      target_type: 'comment',
      target_id: comment.id,
      reason: 'conteudo_inadequado',
    });

    expect(response.status).toBe(201);
    const rows = await prisma.report.findMany({
      where: { reporterUserId: reporter, status: 'pending' },
    });
    expect(rows.some((row) => row.targetId === comment.id)).toBe(true);
  });

  it('IT-007 a duplicate report for the same target returns 409', async () => {
    const category = await upsertCategory(
      RecipeCategory.sobremesa,
      'Sobremesa',
    );
    const recipe = await upsertRecipe('it-007-reports-recipe', category.id);
    const author = 'it-007-reports-author';
    const reporter = 'it-007-reports-reporter';
    await onboard(author);
    await onboard(reporter);
    const comment = await seedComment(recipe.id, author);

    await report(reporter, {
      target_type: 'comment',
      target_id: comment.id,
      reason: 'spam',
    }).expect(201);
    const second = await report(reporter, {
      target_type: 'comment',
      target_id: comment.id,
      reason: 'spam',
    });

    expect(second.status).toBe(409);
  });

  it('IT-008 an 11th report within the same day returns 429', async () => {
    const category = await upsertCategory(RecipeCategory.bebida, 'Bebida');
    const author = 'it-008-reports-author';
    const reporter = 'it-008-reports-reporter';
    await onboard(author);
    await onboard(reporter);

    const priorComments = await Promise.all(
      Array.from({ length: 10 }, async (_, index) => {
        const recipe = await upsertRecipe(
          `it-008-reports-prior-${index}`,
          category.id,
        );
        return seedComment(recipe.id, author);
      }),
    );
    await prisma.report.createMany({
      data: priorComments.map((comment) => ({
        reporterUserId: reporter,
        targetType: 'comment',
        targetId: comment.id,
        reason: 'spam',
      })),
    });
    const newRecipe = await upsertRecipe('it-008-reports-11th', category.id);
    const newComment = await seedComment(newRecipe.id, author);

    const response = await report(reporter, {
      target_type: 'comment',
      target_id: newComment.id,
      reason: 'spam',
    });

    expect(response.status).toBe(429);
    const rows = await prisma.report.findMany({
      where: { reporterUserId: reporter, targetId: newComment.id },
    });
    expect(rows).toHaveLength(0);
  });

  it('unknown target returns 404', async () => {
    const reporter = 'it-reports-unknown-target';
    await onboard(reporter);

    const response = await report(reporter, {
      target_type: 'comment',
      target_id: '00000000-0000-4000-8000-000000000000',
      reason: 'spam',
    });

    expect(response.status).toBe(404);
  });
});
