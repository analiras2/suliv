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

interface CommentRatingBody {
  id: string;
  userId: string;
  rating: number;
  commentText: string | null;
}

interface PaginatedCommentsBody {
  items: CommentRatingBody[];
  nextCursor: string | null;
}

interface RecipeDetailAggregateBody {
  averageRating: number | null;
  ratingCount: number;
}

describe('Comments/ratings routes (integration)', () => {
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

  function submitComment(
    recipeId: string,
    userId: string,
    body: { rating: number; comment_text?: string },
  ) {
    return request(app.getHttpServer())
      .post(`/recipes/${recipeId}/comments`)
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send(body);
  }

  function listComments(recipeId: string) {
    return request(app.getHttpServer()).get(`/recipes/${recipeId}/comments`);
  }

  function deleteComment(commentId: string, userId: string) {
    return request(app.getHttpServer())
      .delete(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${tokenFor(userId)}`);
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

  it('IT-001 first submission returns 201-equivalent and appears in the list', async () => {
    const category = await upsertCategory(RecipeCategory.lanche, 'Lanche');
    const recipe = await upsertRecipe('it-001-comments-first', category.id);
    const user = 'it-001-comments-user';
    await onboard(user);

    const response = await submitComment(recipe.id, user, {
      rating: 4,
      comment_text: 'ótima',
    });
    const body = response.body as CommentRatingBody;

    expect(response.status).toBeLessThan(300);
    expect(body.rating).toBe(4);
    expect(body.commentText).toBe('ótima');

    const list = await listComments(recipe.id).expect(200);
    const listBody = list.body as PaginatedCommentsBody;
    expect(listBody.items.some((item) => item.userId === user)).toBe(true);
  });

  it('IT-002 a second submission upserts, list shows exactly one entry with the latest values', async () => {
    const category = await upsertCategory(
      RecipeCategory.sobremesa,
      'Sobremesa',
    );
    const recipe = await upsertRecipe('it-002-comments-upsert', category.id);
    const user = 'it-002-comments-user';
    await onboard(user);

    await submitComment(recipe.id, user, { rating: 3 });
    await submitComment(recipe.id, user, {
      rating: 5,
      comment_text: 'mudei de ideia',
    });

    const list = await listComments(recipe.id).expect(200);
    const listBody = list.body as PaginatedCommentsBody;
    const entriesFromUser = listBody.items.filter(
      (item) => item.userId === user,
    );
    expect(entriesFromUser).toHaveLength(1);
    expect(entriesFromUser[0].rating).toBe(5);
  });

  it('IT-003 delete by a non-author returns 403, row stays in the list', async () => {
    const category = await upsertCategory(RecipeCategory.bebida, 'Bebida');
    const recipe = await upsertRecipe('it-003-comments-delete', category.id);
    const author = 'it-003-comments-author';
    const otherUser = 'it-003-comments-other';
    await onboard(author);
    await onboard(otherUser);
    const submitted = await submitComment(recipe.id, author, { rating: 4 });
    const commentId = (submitted.body as CommentRatingBody).id;

    await deleteComment(commentId, otherUser).expect(403);

    const list = await listComments(recipe.id).expect(200);
    const listBody = list.body as PaginatedCommentsBody;
    expect(listBody.items.some((item) => item.id === commentId)).toBe(true);
  });

  it('IT-004 a 21st comment/rating submission within the same day returns 429', async () => {
    const category = await upsertCategory(
      RecipeCategory.molhos_acompanhamentos,
      'Molhos/Acompanhamentos',
    );
    const user = 'it-004-comments-user';
    await onboard(user);

    const priorRecipes = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        upsertRecipe(`it-004-comments-prior-${index}`, category.id),
      ),
    );
    await prisma.commentRating.createMany({
      data: priorRecipes.map((recipe) => ({
        recipeId: recipe.id,
        userId: user,
        rating: 5,
      })),
    });
    const newRecipe = await upsertRecipe('it-004-comments-21st', category.id);

    const response = await submitComment(newRecipe.id, user, { rating: 1 });

    expect(response.status).toBe(429);
    const rows = await prisma.commentRating.findMany({
      where: { recipeId: newRecipe.id, userId: user },
    });
    expect(rows).toHaveLength(0);
  });

  // painel-administrativo-moderacao's POST /admin/reports/:id/resolve
  // { action: 'hide_content' } is not implemented in this codebase snapshot
  // (out of this task's scope). This simulates its documented side effect
  // (comments_ratings.status -> hidden) directly to verify the read-side
  // exclusion this task owns; the resolution flow itself belongs to that
  // feature's own suite.
  it('IT-005 a comment hidden via moderator resolution disappears from list and average', async () => {
    const category = await upsertCategory(
      RecipeCategory.almoco_jantar,
      'Almoço/Jantar',
    );
    const recipe = await upsertRecipe('it-005-comments-hidden', category.id);
    const user = 'it-005-comments-user';
    await onboard(user);
    const submitted = await submitComment(recipe.id, user, { rating: 1 });
    const commentId = (submitted.body as CommentRatingBody).id;

    await prisma.commentRating.update({
      where: { id: commentId },
      data: { status: 'hidden' },
    });

    const list = await listComments(recipe.id).expect(200);
    const listBody = list.body as PaginatedCommentsBody;
    expect(listBody.items.some((item) => item.id === commentId)).toBe(false);

    const recipeDetail = await request(app.getHttpServer())
      .get(`/recipes/${recipe.slug}`)
      .expect(200);
    const detailBody = recipeDetail.body as RecipeDetailAggregateBody;
    expect(detailBody.ratingCount).toBe(0);
    expect(detailBody.averageRating).toBeNull();
  });

  it('IT-010 the removed PUT /recipes/:recipeId/rating route no longer exists', async () => {
    const category = await upsertCategory(
      RecipeCategory.cafe_da_manha,
      'Café da Manhã',
    );
    const recipe = await upsertRecipe(
      'it-010-comments-legacy-put',
      category.id,
    );
    const user = 'it-010-comments-user';
    await onboard(user);

    await request(app.getHttpServer())
      .put(`/recipes/${recipe.id}/rating`)
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send({ rating: 4 })
      .expect(404);

    await submitComment(recipe.id, user, { rating: 4 }).expect(201);
  });
});
