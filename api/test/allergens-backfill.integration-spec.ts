import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, RecipeCategory } from '@prisma/client';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { App } from 'supertest/types';
import { AllergenBackfillService } from '../src/allergen-classification/allergen-backfill.service';
import { AllergenClassificationService } from '../src/allergen-classification/allergen-classification.service';
import { AppModule } from '../src/app.module';
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

const ISSUER_PATH = '/auth/v1';

interface RecipeDetailBody {
  slug: string;
  conflictsWithUser?: boolean;
  conflictingAllergens?: string[];
}

jest.setTimeout(30000);

// Task 4 (allergens:backfill CLI) proof: the CLI's Nest bootstrap
// (allergen-backfill.cli.ts) only wraps AllergenBackfillService.runBackfill
// with printing/exit-code handling, so exercising the service through the
// same DI container the CLI uses is equivalent to running the command.
describe('Allergen backfill CLI (task_04)', () => {
  const prisma = new PrismaClient();
  const classifier = new AllergenClassificationService();
  const trustedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const supabaseAdmin = { deleteUser: jest.fn<Promise<void>, [string]>() };
  let app: INestApplication<App>;
  let jwksServer: Server;
  let issuer: string;
  let backfillService: AllergenBackfillService;
  let categoryId: string;

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
    backfillService = moduleFixture.get(AllergenBackfillService);

    const category = await prisma.category.upsert({
      where: { key: RecipeCategory.almoco_jantar },
      update: {},
      create: { key: RecipeCategory.almoco_jantar, label: 'Almoço/Jantar' },
    });
    categoryId = category.id;
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

  async function onboardWithAllergens(userId: string, allergenIds: string[]) {
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

  async function createApprovedRecipe(slug: string, ingredientNames: string[]) {
    const recipe = await prisma.recipe.create({
      data: {
        slug,
        title: slug,
        description: `Fixture recipe for ${slug}`,
        categoryId,
        prepTimeMinutes: 10,
        timeBucket: 'ate_15',
        servings: 2,
        difficulty: 'iniciante',
        dietPreference: 'vegano',
        status: 'aprovada',
        approvedAt: new Date(),
      },
    });
    if (ingredientNames.length > 0) {
      await prisma.recipeIngredient.createMany({
        data: ingredientNames.map((name, index) => ({
          recipeId: recipe.id,
          order: index + 1,
          name,
          quantity: 1,
          unit: 'unidade' as const,
          scalesWithServings: true,
        })),
      });
    }
    return recipe;
  }

  it('IT-019 the backfill regenerates stale/missing projections to match current ingredient detection', async () => {
    const milkTerm = `leite it-019 ${randomUUID()}`;
    const eggTerm = `ovos it-019 ${randomUUID()}`;
    const milk = await seedApprovedTerm(milkTerm);
    const egg = await seedApprovedTerm(eggTerm);
    const stray = await prisma.allergen.create({
      data: { name: `Estranho-${randomUUID()}`, status: 'approved' },
    });

    const missingProjection = await createApprovedRecipe(
      `it-019-missing-${randomUUID()}`,
      [milkTerm],
    );
    const staleProjection = await createApprovedRecipe(
      `it-019-stale-${randomUUID()}`,
      [eggTerm],
    );
    await prisma.recipeAllergen.create({
      data: { recipeId: staleProjection.id, allergenId: stray.id },
    });

    const result = await backfillService.runBackfill();

    expect(result.failedRecipeIds).toEqual([]);

    const missingRows = await prisma.recipeAllergen.findMany({
      where: { recipeId: missingProjection.id },
    });
    expect(missingRows.map((row) => row.allergenId)).toEqual([milk.id]);

    const staleRows = await prisma.recipeAllergen.findMany({
      where: { recipeId: staleProjection.id },
    });
    expect(staleRows.map((row) => row.allergenId)).toEqual([egg.id]);
  });

  it('IT-020 running the backfill twice across multiple batches converges to the same duplicate-free projection', async () => {
    const milkTerm = `leite it-020 ${randomUUID()}`;
    const milk = await seedApprovedTerm(milkTerm);
    const recipes = await Promise.all(
      Array.from({ length: 3 }, (_, index) =>
        createApprovedRecipe(`it-020-recipe-${index}-${randomUUID()}`, [
          milkTerm,
        ]),
      ),
    );

    const firstRun = await backfillService.runBackfill(1);
    const secondRun = await backfillService.runBackfill(1);

    expect(firstRun.failedRecipeIds).toEqual([]);
    expect(secondRun.failedRecipeIds).toEqual([]);

    for (const recipe of recipes) {
      const rows = await prisma.recipeAllergen.findMany({
        where: { recipeId: recipe.id },
      });
      expect(rows.map((row) => row.allergenId)).toEqual([milk.id]);
    }
  });

  it('IT-021 a recipe with no ingredient rows loses its stale projection after backfill', async () => {
    const stray = await prisma.allergen.create({
      data: { name: `Estranho-${randomUUID()}`, status: 'approved' },
    });
    const recipe = await createApprovedRecipe(
      `it-021-empty-${randomUUID()}`,
      [],
    );
    await prisma.recipeAllergen.create({
      data: { recipeId: recipe.id, allergenId: stray.id },
    });

    const result = await backfillService.runBackfill();

    expect(result.failedRecipeIds).toEqual([]);
    const rows = await prisma.recipeAllergen.findMany({
      where: { recipeId: recipe.id },
    });
    expect(rows).toEqual([]);
  });

  it('E2E-005 running the backfill against a historical recipe with matching ingredients but no projection surfaces the allergy banner', async () => {
    const milkTerm = `leite e2e-005 ${randomUUID()}`;
    const milk = await seedApprovedTerm(milkTerm);
    const slug = `e2e-005-historical-${randomUUID()}`;
    await createApprovedRecipe(slug, [milkTerm]);

    const preBackfill = await prisma.recipeAllergen.findMany({
      where: { recipe: { slug } },
    });
    expect(preBackfill).toEqual([]);

    const result = await backfillService.runBackfill();
    expect(result.failedRecipeIds).toEqual([]);

    const user = `e2e-005-user-${randomUUID()}`;
    await onboardWithAllergens(user, [milk.id]);

    const response = await request(app.getHttpServer())
      .get(`/recipes/${slug}`)
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .expect(200);
    const body = response.body as RecipeDetailBody;

    expect(body.conflictsWithUser).toBe(true);
    expect(body.conflictingAllergens).toContain(milk.name);
  });
});
