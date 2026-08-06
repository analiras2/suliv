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
import { AllergenClassificationService } from '../src/allergen-classification/allergen-classification.service';
import { AppModule } from '../src/app.module';
import { RecipeImportService } from '../src/recipe-import/recipe-import.service';
import {
  RecipeTranslationService,
  TranslatableRecipe,
  TranslatedRecipe,
} from '../src/recipe-import/recipe-translation.service';
import { SpoonacularClient } from '../src/recipe-import/spoonacular.client';
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

const ISSUER_PATH = '/auth/v1';

interface RecipeDetailBody {
  slug: string;
  conflictsWithUser?: boolean;
  conflictingAllergens?: string[];
}

// Task 2 (Runtime recipe and import classification integration) proof: the
// public author/import flows — not direct recipeAllergen fixture rows — must
// drive recipe_allergens, since RecipesService.create/update/upsertDraftWithClient
// now call AllergenClassificationService.syncRecipeAllergens transactionally.
describe('Recipe allergen classification integration (task_02)', () => {
  const prisma = new PrismaClient();
  const classifier = new AllergenClassificationService();
  const trustedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const supabaseAdmin = { deleteUser: jest.fn<Promise<void>, [string]>() };
  let app: INestApplication<App>;
  let jwksServer: Server;
  let issuer: string;
  let categoryId: string;
  let importService: RecipeImportService;
  const translateToPortuguese = jest.fn<
    Promise<TranslatedRecipe>,
    [TranslatableRecipe]
  >();

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
      .overrideProvider(SpoonacularClient)
      .useValue({ searchVeganRecipes: jest.fn().mockResolvedValue([]) })
      .overrideProvider(RecipeTranslationService)
      .useValue({ translateToPortuguese })
      .compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ forbidNonWhitelisted: true, whitelist: true }),
    );
    await app.init();
    importService = moduleFixture.get(RecipeImportService);

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

  async function bootstrapUser(userId: string, termsVersion?: string) {
    await request(app.getHttpServer())
      .post('/me/bootstrap')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({ name: 'Autor' })
      .expect(201);
    if (termsVersion) {
      await request(app.getHttpServer())
        .post('/me/terms-acceptance')
        .set('Authorization', `Bearer ${tokenFor(userId)}`)
        .send({ termsVersion })
        .expect(200);
    }
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

  // Creates a fresh approved allergen with one cataloged ingredient term so
  // each test's classification signal is isolated from other spec files.
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

  function ingredientNamed(name: string, order = 1) {
    return {
      name,
      quantity: 1,
      unit: 'unidade' as const,
      scalesWithServings: true,
      order,
    };
  }

  function draftPayload(overrides: Record<string, unknown> = {}) {
    return {
      id: randomUUID(),
      title: 'Receita de teste',
      description: 'Receita usada para provar a sincronizacao de alergenos.',
      categoryId,
      prepTimeMinutes: 15,
      servings: 2,
      difficulty: 'iniciante',
      dietPreference: 'vegano',
      ingredients: [ingredientNamed('Ingrediente neutro')],
      steps: [{ order: 1, description: 'Misture tudo.', stepTimeSeconds: 60 }],
      ...overrides,
    };
  }

  async function loginAdmin(): Promise<string> {
    const email = `admin-allergen-classification-${randomUUID()}@example.com`;
    await prisma.admin.create({
      data: {
        email,
        passwordHash: hashSync('correct-password', 10),
        role: 'moderator',
      },
    });
    const response = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email, password: 'correct-password' })
      .expect(200);
    return (response.body as { token: string }).token;
  }

  describe('POST /recipes (create)', () => {
    it('IT-001 an approved matching ingredient produces exactly one recipe_allergens row', async () => {
      const userId = `it-001-author-${randomUUID()}`;
      await bootstrapUser(userId);
      const milk = await seedApprovedTerm('Leite');
      const recipeId = randomUUID();

      await request(app.getHttpServer())
        .post('/recipes')
        .set('Authorization', `Bearer ${tokenFor(userId)}`)
        .send(
          draftPayload({
            id: recipeId,
            ingredients: [ingredientNamed('Leite')],
          }),
        )
        .expect(201);

      const projection = await prisma.recipeAllergen.findMany({
        where: { recipeId },
      });
      expect(projection).toHaveLength(1);
      expect(projection[0].allergenId).toBe(milk.id);
    });

    it('IT-003 an unmatched ingredient produces an empty recipe_allergens projection', async () => {
      const userId = `it-003-author-${randomUUID()}`;
      await bootstrapUser(userId);
      const recipeId = randomUUID();

      await request(app.getHttpServer())
        .post('/recipes')
        .set('Authorization', `Bearer ${tokenFor(userId)}`)
        .send(
          draftPayload({
            id: recipeId,
            ingredients: [ingredientNamed('Ingrediente sem correspondencia')],
          }),
        )
        .expect(201);

      const projection = await prisma.recipeAllergen.findMany({
        where: { recipeId },
      });
      expect(projection).toHaveLength(0);
    });

    it('IT-004 two ingredient names matching the same allergen produce exactly one composite recipe/allergen row', async () => {
      const userId = `it-004-author-${randomUUID()}`;
      await bootstrapUser(userId);
      const milk = await seedApprovedTerm('Leite');
      await prisma.allergenIngredientTerm.create({
        data: {
          allergenId: milk.id,
          term: 'Leite integral',
          normalizedTerm: classifier.normalizeIngredientName('Leite integral'),
        },
      });
      const recipeId = randomUUID();

      await request(app.getHttpServer())
        .post('/recipes')
        .set('Authorization', `Bearer ${tokenFor(userId)}`)
        .send(
          draftPayload({
            id: recipeId,
            ingredients: [
              ingredientNamed('Leite', 1),
              ingredientNamed('Leite integral', 2),
            ],
          }),
        )
        .expect(201);

      const projection = await prisma.recipeAllergen.findMany({
        where: { recipeId },
      });
      expect(projection).toHaveLength(1);
      expect(projection[0].allergenId).toBe(milk.id);
    });
  });

  describe('PATCH /recipes/:id (update)', () => {
    it('IT-002 replacing a Milk ingredient with a Soy ingredient leaves only the Soy row', async () => {
      const userId = `it-002-author-${randomUUID()}`;
      await bootstrapUser(userId);
      const milk = await seedApprovedTerm('Leite');
      const soy = await seedApprovedTerm('Soja');
      const recipeId = randomUUID();

      await request(app.getHttpServer())
        .post('/recipes')
        .set('Authorization', `Bearer ${tokenFor(userId)}`)
        .send(
          draftPayload({
            id: recipeId,
            ingredients: [ingredientNamed('Leite')],
          }),
        )
        .expect(201);
      const beforeUpdate = await prisma.recipeAllergen.findMany({
        where: { recipeId },
      });
      expect(beforeUpdate.map((row) => row.allergenId)).toEqual([milk.id]);

      await request(app.getHttpServer())
        .patch(`/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${tokenFor(userId)}`)
        .send({ ingredients: [ingredientNamed('Soja')] })
        .expect(200);

      const afterUpdate = await prisma.recipeAllergen.findMany({
        where: { recipeId },
      });
      expect(afterUpdate).toHaveLength(1);
      expect(afterUpdate[0].allergenId).toBe(soy.id);
    });

    it('does not recompute the projection when the update omits ingredients', async () => {
      const userId = `it-002b-author-${randomUUID()}`;
      await bootstrapUser(userId);
      const milk = await seedApprovedTerm('Leite');
      const recipeId = randomUUID();

      await request(app.getHttpServer())
        .post('/recipes')
        .set('Authorization', `Bearer ${tokenFor(userId)}`)
        .send(
          draftPayload({
            id: recipeId,
            ingredients: [ingredientNamed('Leite')],
          }),
        )
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/recipes/${recipeId}`)
        .set('Authorization', `Bearer ${tokenFor(userId)}`)
        .send({ title: 'Titulo atualizado' })
        .expect(200);

      const projection = await prisma.recipeAllergen.findMany({
        where: { recipeId },
      });
      expect(projection).toHaveLength(1);
      expect(projection[0].allergenId).toBe(milk.id);
    });
  });

  describe('POST /sync draft_upsert', () => {
    it('IT-005 posting the same draft_upsert payload twice succeeds both times and leaves one row per detected allergen', async () => {
      const userId = `it-005-author-${randomUUID()}`;
      await bootstrapUser(userId);
      const milk = await seedApprovedTerm('Leite');
      const recipeId = randomUUID();
      const payload = draftPayload({
        id: recipeId,
        ingredients: [ingredientNamed('Leite')],
      });

      await request(app.getHttpServer())
        .post('/sync')
        .set('Authorization', `Bearer ${tokenFor(userId)}`)
        .send({
          actions: [
            {
              type: 'draft_upsert',
              payload,
              idempotency_key: `sync-key-${randomUUID()}`,
            },
          ],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/sync')
        .set('Authorization', `Bearer ${tokenFor(userId)}`)
        .send({
          actions: [
            {
              type: 'draft_upsert',
              payload,
              idempotency_key: `sync-key-${randomUUID()}`,
            },
          ],
        })
        .expect(201);

      const projection = await prisma.recipeAllergen.findMany({
        where: { recipeId },
      });
      expect(projection).toHaveLength(1);
      expect(projection[0].allergenId).toBe(milk.id);
    });
  });

  it('E2E-001 an authored recipe with a cataloged ingredient shows the allergy banner to a matching user once approved', async () => {
    const authorId = `e2e-001-author-${randomUUID()}`;
    await bootstrapUser(authorId, 'v1');
    const milk = await seedApprovedTerm('Leite');
    const recipeId = randomUUID();

    const created = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenFor(authorId)}`)
      .send(
        draftPayload({ id: recipeId, ingredients: [ingredientNamed('Leite')] }),
      )
      .expect(201);
    const slug = (created.body as { slug: string }).slug;

    await request(app.getHttpServer())
      .patch(`/recipes/${recipeId}`)
      .set('Authorization', `Bearer ${tokenFor(authorId)}`)
      .send({ coverImageUrl: 'https://img/cover.jpg' })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/recipes/${recipeId}/submit`)
      .set('Authorization', `Bearer ${tokenFor(authorId)}`)
      .expect(200);

    const adminToken = await loginAdmin();
    await request(app.getHttpServer())
      .post(`/admin/recipes/${recipeId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const allergicUser = `e2e-001-allergic-user-${randomUUID()}`;
    await onboardWithAllergens(allergicUser, [milk.id]);

    const response = await request(app.getHttpServer())
      .get(`/recipes/${slug}`)
      .set('Authorization', `Bearer ${tokenFor(allergicUser)}`)
      .expect(200);
    const body = response.body as RecipeDetailBody;

    expect(body.conflictsWithUser).toBe(true);
    expect(body.conflictingAllergens).toContain(milk.name);
  });

  it('E2E-002 an imported recipe translated to a cataloged ingredient shows the allergy banner once promoted and approved', async () => {
    const milk = await seedApprovedTerm('leite condensado');
    const externalSourceId = `spoonacular:e2e-002-${randomUUID()}`;
    await prisma.recipeImportCandidate.create({
      data: {
        externalSourceId,
        title: 'Vegan Lentil Soup',
        description: 'A hearty vegan soup.',
        category: RecipeCategory.almoco_jantar,
        prepTimeMinutes: 30,
        servings: 4,
        difficulty: 'intermediario',
        coverImageUrl: 'https://example.com/soup.jpg',
        ingredients: [
          {
            name: 'lentils',
            quantity: 200,
            unit: 'g',
            scalesWithServings: true,
            order: 1,
          },
        ],
        steps: [
          {
            order: 1,
            description: 'Simmer everything together.',
            stepTimeSeconds: null,
          },
        ],
      },
    });
    translateToPortuguese.mockResolvedValue({
      title: 'Sopa de lentilha com leite condensado',
      description: 'Uma sopa vegana reconfortante.',
      ingredientNames: ['leite condensado'],
      stepDescriptions: ['Cozinhe tudo junto em fogo baixo.'],
    });

    await importService.runImport(1);

    const recipe = await prisma.recipe.findUniqueOrThrow({
      where: { externalSourceId },
    });

    const adminToken = await loginAdmin();
    await request(app.getHttpServer())
      .post(`/admin/recipes/${recipe.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const allergicUser = `e2e-002-allergic-user-${randomUUID()}`;
    await onboardWithAllergens(allergicUser, [milk.id]);

    const response = await request(app.getHttpServer())
      .get(`/recipes/${recipe.slug}`)
      .set('Authorization', `Bearer ${tokenFor(allergicUser)}`)
      .expect(200);
    const body = response.body as RecipeDetailBody;

    expect(body.conflictsWithUser).toBe(true);
    expect(body.conflictingAllergens).toContain(milk.name);
  });
});
