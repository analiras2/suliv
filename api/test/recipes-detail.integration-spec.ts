import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, RecipeCategory } from '@prisma/client';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { App } from 'supertest/types';
import { AllergenClassificationService } from '../src/allergen-classification/allergen-classification.service';
import { AppModule } from '../src/app.module';
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

const ISSUER_PATH = '/auth/v1';

interface RecipeDetailBody {
  id: string;
  slug: string;
  description: string;
  servings: number;
  dietPreference: string;
  category: { key: string };
  ingredients: unknown[];
  steps: unknown[];
  conflictsWithUser?: boolean;
  conflictingAllergens?: string[];
  isFavorited?: boolean;
  averageRating: number | null;
  ratingCount: number;
}

jest.setTimeout(20000);

describe('GET /recipes/:slug (integration)', () => {
  const prisma = new PrismaClient();
  const classifier = new AllergenClassificationService();
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

  function getBySlug(slug: string, userId?: string) {
    const req = request(app.getHttpServer()).get(`/recipes/${slug}`);
    return userId
      ? req.set('Authorization', `Bearer ${tokenFor(userId)}`)
      : req;
  }

  async function onboard(
    userId: string,
    allergenIds: string[] = [],
  ): Promise<void> {
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
        allergen_ids: allergenIds,
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

  async function upsertRecipe(params: {
    slug: string;
    categoryId: string;
    status?: 'aprovada' | 'em_analise' | 'removida';
    authorId?: string;
  }) {
    const shared = {
      title: params.slug,
      description: `Fixture recipe for ${params.slug}`,
      categoryId: params.categoryId,
      prepTimeMinutes: 10,
      timeBucket: 'ate_15' as const,
      servings: 4,
      difficulty: 'iniciante' as const,
      dietPreference: 'flexitariano' as const,
      status: params.status ?? ('aprovada' as const),
      authorId: params.authorId,
      approvedAt:
        (params.status ?? 'aprovada') === 'aprovada' ? new Date() : null,
    };
    return prisma.recipe.upsert({
      where: { slug: params.slug },
      update: shared,
      create: { slug: params.slug, ...shared },
    });
  }

  async function addIngredientAndStep(recipeId: string) {
    await prisma.recipeIngredient.upsert({
      where: { recipeId_order: { recipeId, order: 1 } },
      update: {},
      create: {
        recipeId,
        order: 1,
        name: 'Sal',
        quantity: 1,
        unit: 'pitada',
        scalesWithServings: false,
      },
    });
    await prisma.recipeStep.upsert({
      where: { recipeId_order: { recipeId, order: 1 } },
      update: {},
      create: {
        recipeId,
        order: 1,
        description: 'Misture os ingredientes.',
        stepTimeSeconds: 60,
      },
    });
  }

  // task_04: seeds a catalog term and materializes recipe_allergens through
  // the shared classifier (production write path), not a direct
  // recipeAllergen.upsert fixture, so these tests prove the personalized
  // read paths react to catalog-derived projections.
  async function seedApprovedTerm(term: string) {
    const allergen = await prisma.allergen.create({
      data: { name: `Alergeno-${randomUUID()}`, status: 'approved' },
    });
    await prisma.allergenIngredientTerm.create({
      data: {
        allergenId: allergen.id,
        term,
        normalizedTerm: classifier.normalizeIngredientName(term),
      },
    });
    return allergen;
  }

  async function setIngredients(recipeId: string, names: string[]) {
    await prisma.recipeIngredient.deleteMany({ where: { recipeId } });
    await prisma.recipeIngredient.createMany({
      data: names.map((name, index) => ({
        recipeId,
        order: index + 1,
        name,
        quantity: 1,
        unit: 'unidade' as const,
        scalesWithServings: true,
      })),
    });
    await prisma.$transaction((tx) =>
      classifier.syncRecipeAllergens(tx, recipeId, names),
    );
  }

  it('IT-001 public request (no Authorization) returns 200 with content, no authenticated-only fields', async () => {
    const category = await upsertCategory(RecipeCategory.lanche, 'Lanche');
    const recipe = await upsertRecipe({
      slug: 'it-001-recipe-detail-public',
      categoryId: category.id,
    });
    await addIngredientAndStep(recipe.id);

    const response = await getBySlug('it-001-recipe-detail-public').expect(200);
    const body = response.body as RecipeDetailBody;

    expect(body.slug).toBe('it-001-recipe-detail-public');
    expect(body.servings).toBe(4);
    expect(body.ingredients.length).toBeGreaterThan(0);
    expect(body.steps.length).toBeGreaterThan(0);
    expect(body.conflictsWithUser).toBeUndefined();
    expect(body.conflictingAllergens).toBeUndefined();
    expect(body.isFavorited).toBeUndefined();
  });

  it('IT-002 authenticated request for a conflicting-allergy user returns 200 with warning fields populated', async () => {
    const category = await upsertCategory(
      RecipeCategory.sobremesa,
      'Sobremesa',
    );
    const recipe = await upsertRecipe({
      slug: 'it-002-recipe-detail-conflict',
      categoryId: category.id,
    });
    await addIngredientAndStep(recipe.id);
    const allergen = await prisma.allergen.upsert({
      where: { name: 'Leite' },
      update: { status: 'approved' },
      create: { name: 'Leite', status: 'approved' },
    });
    await prisma.recipeAllergen.upsert({
      where: {
        recipeId_allergenId: { recipeId: recipe.id, allergenId: allergen.id },
      },
      update: {},
      create: { recipeId: recipe.id, allergenId: allergen.id },
    });
    const user = 'it-002-recipe-detail-user';
    await onboard(user, [allergen.id]);

    const response = await getBySlug(
      'it-002-recipe-detail-conflict',
      user,
    ).expect(200);
    const body = response.body as RecipeDetailBody;

    expect(body.conflictsWithUser).toBe(true);
    expect(body.conflictingAllergens).toContain('Leite');
  });

  it('IT-003 a nonexistent slug returns 404', async () => {
    await getBySlug('it-003-does-not-exist').expect(404);
  });

  it("IT-004 a 'removida' recipe returns 404", async () => {
    const category = await upsertCategory(RecipeCategory.bebida, 'Bebida');
    await upsertRecipe({
      slug: 'it-004-recipe-detail-removida',
      categoryId: category.id,
      status: 'removida',
    });

    await getBySlug('it-004-recipe-detail-removida').expect(404);
  });

  it('IT-005 unapproved recipe, non-author JWT, returns 404', async () => {
    const category = await upsertCategory(
      RecipeCategory.molhos_acompanhamentos,
      'Molhos/Acompanhamentos',
    );
    const author = 'it-005-recipe-detail-author';
    await onboard(author);
    await upsertRecipe({
      slug: 'it-005-recipe-detail-unapproved',
      categoryId: category.id,
      status: 'em_analise',
      authorId: author,
    });
    const otherUser = 'it-005-recipe-detail-other';
    await onboard(otherUser);

    await getBySlug('it-005-recipe-detail-unapproved', otherUser).expect(404);
  });

  it("IT-006 unapproved recipe, author's own JWT, returns 200", async () => {
    const category = await upsertCategory(
      RecipeCategory.almoco_jantar,
      'Almoço/Jantar',
    );
    const author = 'it-006-recipe-detail-author';
    await onboard(author);
    const recipe = await upsertRecipe({
      slug: 'it-006-recipe-detail-unapproved-author',
      categoryId: category.id,
      status: 'em_analise',
      authorId: author,
    });
    await addIngredientAndStep(recipe.id);

    const response = await getBySlug(
      'it-006-recipe-detail-unapproved-author',
      author,
    ).expect(200);
    const body = response.body as RecipeDetailBody;

    expect(body.slug).toBe('it-006-recipe-detail-unapproved-author');
  });

  it('IT-009 averageRating/ratingCount match seeded visible ratings and exclude hidden ones', async () => {
    const category = await upsertCategory(
      RecipeCategory.cafe_da_manha,
      'Café da Manhã',
    );
    const recipe = await upsertRecipe({
      slug: 'it-009-recipe-detail-aggregate',
      categoryId: category.id,
    });
    await addIngredientAndStep(recipe.id);
    await prisma.commentRating.createMany({
      data: [
        { recipeId: recipe.id, userId: 'it-009-rater-1', rating: 4 },
        { recipeId: recipe.id, userId: 'it-009-rater-2', rating: 5 },
        {
          recipeId: recipe.id,
          userId: 'it-009-rater-3',
          rating: 1,
          status: 'hidden',
        },
      ],
    });

    const response = await getBySlug('it-009-recipe-detail-aggregate').expect(
      200,
    );
    const body = response.body as RecipeDetailBody;

    expect(body.averageRating).toBe(4.5);
    expect(body.ratingCount).toBe(2);
  });

  it('IT-009 a recipe with zero visible ratings returns averageRating: null, ratingCount: 0', async () => {
    const category = await upsertCategory(
      RecipeCategory.molhos_acompanhamentos,
      'Molhos/Acompanhamentos',
    );
    const recipe = await upsertRecipe({
      slug: 'it-009-recipe-detail-no-ratings',
      categoryId: category.id,
    });
    await addIngredientAndStep(recipe.id);

    const response = await getBySlug('it-009-recipe-detail-no-ratings').expect(
      200,
    );
    const body = response.body as RecipeDetailBody;

    expect(body.averageRating).toBeNull();
    expect(body.ratingCount).toBe(0);
  });

  it('IT-008 a recipe classified through catalog ingredients returns conflictsWithUser: true and the allergen name for a matching user', async () => {
    const category = await upsertCategory(
      RecipeCategory.sobremesa,
      'Sobremesa',
    );
    const recipe = await upsertRecipe({
      slug: 'it-008-recipe-detail-classified-conflict',
      categoryId: category.id,
    });
    const milk = await seedApprovedTerm('Leite');
    await setIngredients(recipe.id, ['Leite']);
    const user = 'it-008-recipe-detail-user';
    await onboard(user, [milk.id]);

    const response = await getBySlug(
      'it-008-recipe-detail-classified-conflict',
      user,
    ).expect(200);
    const body = response.body as RecipeDetailBody;

    expect(body.conflictsWithUser).toBe(true);
    expect(body.conflictingAllergens).toContain(milk.name);
  });

  it('IT-009 a user with no saved allergies and a user allergic only to another allergen both receive no allergy conflict for the same classified recipe', async () => {
    const category = await upsertCategory(RecipeCategory.lanche, 'LancheIT009');
    const recipe = await upsertRecipe({
      slug: 'it-009-recipe-detail-no-conflict',
      categoryId: category.id,
    });
    await seedApprovedTerm('Leite');
    const soy = await seedApprovedTerm('Soja');
    await setIngredients(recipe.id, ['Leite']);

    const noAllergyUser = 'it-009-recipe-detail-no-allergy-user';
    await onboard(noAllergyUser, []);
    const otherAllergyUser = 'it-009-recipe-detail-other-allergy-user';
    await onboard(otherAllergyUser, [soy.id]);

    const noAllergyResponse = await getBySlug(
      'it-009-recipe-detail-no-conflict',
      noAllergyUser,
    ).expect(200);
    const otherAllergyResponse = await getBySlug(
      'it-009-recipe-detail-no-conflict',
      otherAllergyUser,
    ).expect(200);

    expect((noAllergyResponse.body as RecipeDetailBody).conflictsWithUser).toBe(
      false,
    );
    expect(
      (otherAllergyResponse.body as RecipeDetailBody).conflictsWithUser,
    ).toBe(false);
  });

  it('IT-010 anonymous GET /recipes/:slug for a classified recipe returns content without personalized conflict fields', async () => {
    const category = await upsertCategory(RecipeCategory.bebida, 'BebidaIT010');
    const recipe = await upsertRecipe({
      slug: 'it-010-recipe-detail-anonymous-classified',
      categoryId: category.id,
    });
    await seedApprovedTerm('Leite');
    await setIngredients(recipe.id, ['Leite']);

    const response = await getBySlug(
      'it-010-recipe-detail-anonymous-classified',
    ).expect(200);
    const body = response.body as RecipeDetailBody;

    expect(body.conflictsWithUser).toBeUndefined();
    expect(body.conflictingAllergens).toBeUndefined();
  });

  it('IT-011 a recipe classified with two allergens returns each conflicting name once for a user saved against both', async () => {
    const category = await upsertCategory(
      RecipeCategory.almoco_jantar,
      'AlmocoIT011',
    );
    const recipe = await upsertRecipe({
      slug: 'it-011-recipe-detail-double-conflict',
      categoryId: category.id,
    });
    const milk = await seedApprovedTerm('Leite');
    const egg = await seedApprovedTerm('Ovos');
    await setIngredients(recipe.id, ['Leite', 'Ovos']);
    const user = 'it-011-recipe-detail-double-conflict-user';
    await onboard(user, [milk.id, egg.id]);

    const response = await getBySlug(
      'it-011-recipe-detail-double-conflict',
      user,
    ).expect(200);
    const body = response.body as RecipeDetailBody;

    expect(body.conflictsWithUser).toBe(true);
    expect(body.conflictingAllergens).toHaveLength(2);
    expect(new Set(body.conflictingAllergens)).toEqual(
      new Set([milk.name, egg.name]),
    );
  });

  it('IT-012 a concurrent detail read observes only the fully committed old or new allergen set, never a mixed state', async () => {
    const category = await upsertCategory(
      RecipeCategory.molhos_acompanhamentos,
      'MolhosIT012',
    );
    const recipe = await upsertRecipe({
      slug: 'it-012-recipe-detail-concurrent-replacement',
      categoryId: category.id,
    });
    const milk = await seedApprovedTerm('Leite');
    const soy = await seedApprovedTerm('Soja');
    await setIngredients(recipe.id, ['Leite']);
    const user = 'it-012-recipe-detail-concurrent-user';
    await onboard(user, [milk.id, soy.id]);

    let releaseTransaction: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseTransaction = resolve;
    });
    let transactionStarted: () => void = () => {};
    const started = new Promise<void>((resolve) => {
      transactionStarted = resolve;
    });
    const updatePromise = prisma.$transaction(async (tx) => {
      await tx.recipeIngredient.deleteMany({
        where: { recipeId: recipe.id },
      });
      await tx.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          order: 1,
          name: 'Soja',
          quantity: 1,
          unit: 'unidade',
          scalesWithServings: true,
        },
      });
      await classifier.syncRecipeAllergens(tx, recipe.id, ['Soja']);
      transactionStarted();
      await gate;
    });
    await started;

    const concurrentResponse = await getBySlug(
      'it-012-recipe-detail-concurrent-replacement',
      user,
    ).expect(200);
    const duringTx =
      (concurrentResponse.body as RecipeDetailBody).conflictingAllergens ?? [];
    releaseTransaction();
    await updatePromise;

    expect(duringTx).toHaveLength(1);
    expect([milk.name, soy.name]).toContain(duringTx[0]);

    const afterCommitResponse = await getBySlug(
      'it-012-recipe-detail-concurrent-replacement',
      user,
    ).expect(200);
    expect(
      (afterCommitResponse.body as RecipeDetailBody).conflictingAllergens,
    ).toEqual([soy.name]);
  });

  it('E2E-003 opening the same classified recipe as a matching user, a nonmatching user, and anonymously only shows the banner to the matching user', async () => {
    const category = await upsertCategory(
      RecipeCategory.cafe_da_manha,
      'CafeIT-E2E003',
    );
    const recipe = await upsertRecipe({
      slug: 'e2e-003-recipe-detail-warning-scope',
      categoryId: category.id,
    });
    const milk = await seedApprovedTerm('Leite');
    const soy = await seedApprovedTerm('Soja');
    await setIngredients(recipe.id, ['Leite']);

    const matchingUser = 'e2e-003-matching-user';
    await onboard(matchingUser, [milk.id]);
    const nonmatchingUser = 'e2e-003-nonmatching-user';
    await onboard(nonmatchingUser, [soy.id]);

    const matchingResponse = await getBySlug(
      'e2e-003-recipe-detail-warning-scope',
      matchingUser,
    ).expect(200);
    const nonmatchingResponse = await getBySlug(
      'e2e-003-recipe-detail-warning-scope',
      nonmatchingUser,
    ).expect(200);
    const anonymousResponse = await getBySlug(
      'e2e-003-recipe-detail-warning-scope',
    ).expect(200);

    expect((matchingResponse.body as RecipeDetailBody).conflictsWithUser).toBe(
      true,
    );
    expect(
      (nonmatchingResponse.body as RecipeDetailBody).conflictsWithUser,
    ).toBe(false);
    expect(
      (anonymousResponse.body as RecipeDetailBody).conflictsWithUser,
    ).toBeUndefined();
  });
});
