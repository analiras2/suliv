import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, RecipeCategory } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import request from 'supertest';
import { App } from 'supertest/types';
import { AllergenClassificationService } from '../src/allergen-classification/allergen-classification.service';
import { AppModule } from '../src/app.module';
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

interface IngredientTermBody {
  id: string;
  allergenId: string;
  term: string;
}

// Task 3 (Admin catalog CRUD and term editor): the admin/allergens
// ingredient-term endpoints, scoped ownership/status/uniqueness rules, audit
// events, and the deferred-backfill boundary for term deletion.
describe('Admin allergen catalog CRUD (integration)', () => {
  const prisma = new PrismaClient();
  const classifier = new AllergenClassificationService();
  const trustedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const supabaseAdmin = { deleteUser: jest.fn<Promise<void>, [string]>() };
  let app: INestApplication<App>;
  let jwksServer: Server;
  let adminToken: string;
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

    const adminEmail = `admin-allergen-catalog-${randomUUID()}@example.com`;
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

  async function seedApprovedAllergen(name: string) {
    return prisma.allergen.create({ data: { name, status: 'approved' } });
  }

  async function seedPendingAllergen(name: string) {
    return prisma.allergen.create({ data: { name, status: 'pending' } });
  }

  async function createBareRecipe() {
    const suffix = randomUUID().slice(0, 8);
    return prisma.recipe.create({
      data: {
        slug: `catalog-it-${suffix}`,
        title: `Catalog IT ${suffix}`,
        description: 'Receita usada para provar o efeito da exclusao de termo.',
        categoryId,
        prepTimeMinutes: 15,
        timeBucket: 'ate_15',
        servings: 2,
        difficulty: 'iniciante',
        dietPreference: 'flexitariano',
      },
    });
  }

  it('IT-013 authenticated admin lists approved allergens with terms, creates a term, updates it, and deletes it', async () => {
    const allergen = await seedApprovedAllergen(`it-013-${randomUUID()}`);

    const initialList = await request(app.getHttpServer())
      .get('/admin/allergens')
      .query({ status: 'approved' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const initialBody = initialList.body as Array<{
      id: string;
      ingredientTerms: unknown[];
    }>;
    const initialEntry = initialBody.find((item) => item.id === allergen.id);
    expect(initialEntry?.ingredientTerms).toEqual([]);

    const createResponse = await request(app.getHttpServer())
      .post(`/admin/allergens/${allergen.id}/ingredient-terms`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ term: 'Leite integral' })
      .expect(201);
    const created = createResponse.body as IngredientTermBody;
    expect(created.allergenId).toBe(allergen.id);
    expect(created.term).toBe('Leite integral');

    const afterCreateList = await request(app.getHttpServer())
      .get('/admin/allergens')
      .query({ status: 'approved' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const afterCreateBody = afterCreateList.body as Array<{
      id: string;
      ingredientTerms: IngredientTermBody[];
    }>;
    expect(
      afterCreateBody.find((item) => item.id === allergen.id)?.ingredientTerms,
    ).toEqual([
      expect.objectContaining({ id: created.id, term: 'Leite integral' }),
    ]);

    const updateResponse = await request(app.getHttpServer())
      .patch(`/admin/allergens/${allergen.id}/ingredient-terms/${created.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ term: 'Leite desnatado' })
      .expect(200);
    const updated = updateResponse.body as IngredientTermBody;
    expect(updated.id).toBe(created.id);
    expect(updated.term).toBe('Leite desnatado');

    const storedAfterUpdate =
      await prisma.allergenIngredientTerm.findUniqueOrThrow({
        where: { id: created.id },
      });
    expect(storedAfterUpdate.normalizedTerm).toBe(
      classifier.normalizeIngredientName('Leite desnatado'),
    );

    await request(app.getHttpServer())
      .delete(`/admin/allergens/${allergen.id}/ingredient-terms/${created.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await expect(
      prisma.allergenIngredientTerm.findUnique({ where: { id: created.id } }),
    ).resolves.toBeNull();
  });

  it('IT-014 catalog mutation for a pending allergen returns 422; unknown scoped allergen/term returns 404', async () => {
    const pendingAllergen = await seedPendingAllergen(`it-014-${randomUUID()}`);

    await request(app.getHttpServer())
      .post(`/admin/allergens/${pendingAllergen.id}/ingredient-terms`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ term: 'Leite' })
      .expect(422);

    await request(app.getHttpServer())
      .post(`/admin/allergens/${randomUUID()}/ingredient-terms`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ term: 'Leite' })
      .expect(404);

    const approvedAllergen = await seedApprovedAllergen(
      `it-014-approved-${randomUUID()}`,
    );
    await request(app.getHttpServer())
      .patch(
        `/admin/allergens/${approvedAllergen.id}/ingredient-terms/${randomUUID()}`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ term: 'Leite' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(
        `/admin/allergens/${approvedAllergen.id}/ingredient-terms/${randomUUID()}`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('IT-015 two concurrent POST requests for the same normalized term return one success and one 409, leaving one row', async () => {
    const allergen = await seedApprovedAllergen(`it-015-${randomUUID()}`);

    const [first, second] = await Promise.all([
      request(app.getHttpServer())
        .post(`/admin/allergens/${allergen.id}/ingredient-terms`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ term: 'Amendoim torrado' }),
      request(app.getHttpServer())
        .post(`/admin/allergens/${allergen.id}/ingredient-terms`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ term: 'Amendoim Torrado' }),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);

    const rows = await prisma.allergenIngredientTerm.findMany({
      where: {
        allergenId: allergen.id,
        normalizedTerm: classifier.normalizeIngredientName('Amendoim torrado'),
      },
    });
    expect(rows).toHaveLength(1);
  });

  it('IT-016 an unauthenticated admin catalog request returns the guard denial response and writes nothing', async () => {
    const allergen = await seedApprovedAllergen(`it-016-${randomUUID()}`);

    await request(app.getHttpServer())
      .post(`/admin/allergens/${allergen.id}/ingredient-terms`)
      .send({ term: 'Leite' })
      .expect(401);

    const rows = await prisma.allergenIngredientTerm.findMany({
      where: { allergenId: allergen.id },
    });
    expect(rows).toHaveLength(0);
  });

  it('IT-017 POST/PATCH with whitespace or punctuation-only term returns 400 and writes nothing', async () => {
    const allergen = await seedApprovedAllergen(`it-017-${randomUUID()}`);

    await request(app.getHttpServer())
      .post(`/admin/allergens/${allergen.id}/ingredient-terms`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ term: '   ' })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/admin/allergens/${allergen.id}/ingredient-terms`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ term: '!!! ,,,' })
      .expect(400);

    const rowsAfterCreateAttempts =
      await prisma.allergenIngredientTerm.findMany({
        where: { allergenId: allergen.id },
      });
    expect(rowsAfterCreateAttempts).toHaveLength(0);

    const existing = await prisma.allergenIngredientTerm.create({
      data: {
        allergenId: allergen.id,
        term: 'Leite',
        normalizedTerm: classifier.normalizeIngredientName('Leite'),
      },
    });

    await request(app.getHttpServer())
      .patch(`/admin/allergens/${allergen.id}/ingredient-terms/${existing.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ term: '...' })
      .expect(400);

    const stillOriginal = await prisma.allergenIngredientTerm.findUniqueOrThrow(
      {
        where: { id: existing.id },
      },
    );
    expect(stillOriginal.term).toBe('Leite');
  });

  it('IT-018 deleting a term keeps the already-classified recipe row and blocks a subsequent match', async () => {
    const allergen = await seedApprovedAllergen(`it-018-${randomUUID()}`);
    const termValue = `leite it-018 ${randomUUID()}`;
    const term = await prisma.allergenIngredientTerm.create({
      data: {
        allergenId: allergen.id,
        term: termValue,
        normalizedTerm: classifier.normalizeIngredientName(termValue),
      },
    });

    const alreadyClassifiedRecipe = await createBareRecipe();
    await prisma.$transaction((tx) =>
      classifier.syncRecipeAllergens(tx, alreadyClassifiedRecipe.id, [
        termValue,
      ]),
    );
    const beforeDelete = await prisma.recipeAllergen.findMany({
      where: { recipeId: alreadyClassifiedRecipe.id },
    });
    expect(beforeDelete.map((row) => row.allergenId)).toEqual([allergen.id]);

    await request(app.getHttpServer())
      .delete(`/admin/allergens/${allergen.id}/ingredient-terms/${term.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const afterDelete = await prisma.recipeAllergen.findMany({
      where: { recipeId: alreadyClassifiedRecipe.id },
    });
    expect(afterDelete.map((row) => row.allergenId)).toEqual([allergen.id]);

    const newRecipe = await createBareRecipe();
    await prisma.$transaction((tx) =>
      classifier.syncRecipeAllergens(tx, newRecipe.id, [termValue]),
    );
    const newRecipeProjection = await prisma.recipeAllergen.findMany({
      where: { recipeId: newRecipe.id },
    });
    expect(newRecipeProjection).toHaveLength(0);
  });
});
