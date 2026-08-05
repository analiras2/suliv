import { INestApplication, ValidationPipe } from '@nestjs/common';
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
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

const ISSUER_PATH = '/auth/v1';

describe('Admin report resolution (integration)', () => {
  const prisma = new PrismaClient();
  const trustedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const supabaseAdmin = { deleteUser: jest.fn<Promise<void>, [string]>() };
  let app: INestApplication<App>;
  let jwksServer: Server;
  let issuer: string;
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

    const adminEmail = `admin-report-resolution-${randomUUID()}@example.com`;
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
    status: 'em_analise' | 'aprovada' = 'aprovada',
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
        status,
        approvedAt: status === 'aprovada' ? new Date() : null,
      },
    });
  }

  async function seedComment(recipeId: string, userId: string) {
    return prisma.commentRating.create({
      data: { recipeId, userId, rating: 4, status: 'visible' },
    });
  }

  async function seedReport(
    targetType: 'comment' | 'recipe',
    targetId: string,
    reporterUserId: string,
  ) {
    return prisma.report.create({
      data: {
        reporterUserId,
        targetType,
        targetId,
        reason: 'conteudo_inadequado',
        status: 'pending',
      },
    });
  }

  function resolve(reportId: string, action: string) {
    return request(app.getHttpServer())
      .post(`/admin/reports/${reportId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action });
  }

  it('IT-010 resolve(dismiss) leaves the reported target unchanged', async () => {
    const category = await upsertCategory(RecipeCategory.lanche, 'Lanche');
    const author = `it-010-author-${randomUUID()}`;
    const reporter = `it-010-reporter-${randomUUID()}`;
    await onboard(author);
    await onboard(reporter);
    const recipe = await seedRecipe(
      `it-010-recipe-${randomUUID()}`,
      category.id,
      author,
    );
    const comment = await seedComment(recipe.id, author);
    const report = await seedReport('comment', comment.id, reporter);

    await resolve(report.id, 'dismiss').expect(200);

    const updatedComment = await prisma.commentRating.findUniqueOrThrow({
      where: { id: comment.id },
    });
    expect(updatedComment.status).toBe('visible');
    const updatedReport = await prisma.report.findUniqueOrThrow({
      where: { id: report.id },
    });
    expect(updatedReport.status).toBe('reviewed');
  });

  it('IT-011 resolve(hide_content) hides the target comment', async () => {
    const category = await upsertCategory(RecipeCategory.bebida, 'Bebida');
    const author = `it-011-author-${randomUUID()}`;
    const reporter = `it-011-reporter-${randomUUID()}`;
    await onboard(author);
    await onboard(reporter);
    const recipe = await seedRecipe(
      `it-011-recipe-${randomUUID()}`,
      category.id,
      author,
    );
    const comment = await seedComment(recipe.id, author);
    const report = await seedReport('comment', comment.id, reporter);

    await resolve(report.id, 'hide_content').expect(200);

    const updatedComment = await prisma.commentRating.findUniqueOrThrow({
      where: { id: comment.id },
    });
    expect(updatedComment.status).toBe('hidden');
  });

  it('IT-012 resolve(reopen_recipe) returns an aprovada recipe to em_analise', async () => {
    const category = await upsertCategory(
      RecipeCategory.sobremesa,
      'Sobremesa',
    );
    const author = `it-012-author-${randomUUID()}`;
    const reporter = `it-012-reporter-${randomUUID()}`;
    await onboard(author);
    await onboard(reporter);
    const recipe = await seedRecipe(
      `it-012-recipe-${randomUUID()}`,
      category.id,
      author,
      'aprovada',
    );
    const report = await seedReport('recipe', recipe.id, reporter);

    await resolve(report.id, 'reopen_recipe').expect(200);

    const updatedRecipe = await prisma.recipe.findUniqueOrThrow({
      where: { id: recipe.id },
    });
    expect(updatedRecipe.status).toBe('em_analise');
  });
});
