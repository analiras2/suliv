import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

describe('Admin allergen normalization (integration)', () => {
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

    const adminEmail = `allergen-norm-${randomUUID()}@example.com`;
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

  async function seedPendingAllergen(name: string) {
    return prisma.allergen.create({ data: { name, status: 'pending' } });
  }

  it('IT-013 approve makes the term subsequently appear in GET /allergens?status=approved', async () => {
    const allergen = await seedPendingAllergen(`it-013-${randomUUID()}`);

    await request(app.getHttpServer())
      .post(`/admin/allergens/${allergen.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const updated = await prisma.allergen.findUniqueOrThrow({
      where: { id: allergen.id },
    });
    expect(updated.status).toBe('approved');
    expect(updated.reviewedByAdminId).not.toBeNull();

    const listResponse = await request(app.getHttpServer())
      .get('/admin/allergens')
      .query({ status: 'approved' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const body = listResponse.body as Array<{ id: string }>;
    expect(body.some((item) => item.id === allergen.id)).toBe(true);
  });

  it('IT-014 reject a pending term removes it from the pending list', async () => {
    const allergen = await seedPendingAllergen(`it-014-${randomUUID()}`);

    await request(app.getHttpServer())
      .delete(`/admin/allergens/${allergen.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const pendingResponse = await request(app.getHttpServer())
      .get('/admin/allergens')
      .query({ status: 'pending' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const body = pendingResponse.body as Array<{ id: string }>;
    expect(body.some((item) => item.id === allergen.id)).toBe(false);

    await expect(
      prisma.allergen.findUnique({ where: { id: allergen.id } }),
    ).resolves.toBeNull();
  });

  it('IT-015 reject an already-approved allergen returns 409, row untouched', async () => {
    const allergen = await seedPendingAllergen(`it-015-${randomUUID()}`);
    await request(app.getHttpServer())
      .post(`/admin/allergens/${allergen.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/admin/allergens/${allergen.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);

    const stillThere = await prisma.allergen.findUniqueOrThrow({
      where: { id: allergen.id },
    });
    expect(stillThere.status).toBe('approved');
  });
});
