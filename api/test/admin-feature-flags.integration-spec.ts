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

describe('Admin feature flags (integration)', () => {
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

    const adminEmail = `admin-feature-flags-${randomUUID()}@example.com`;
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

  // IT-019: `_tests.md` expects a subsequent `GET /feature-flags` (mobile-facing)
  // to reflect the change. That read-side endpoint belongs to
  // `infraestrutura-tecnica-nao-funcionais` task_04 (not yet built) — this
  // task only owns the admin write side against the same `FeatureFlag` row,
  // so the write's effect is verified directly against the row it wrote.
  it('IT-019 PATCH /admin/feature-flags/:key persists the change', async () => {
    const key = `it-019-${randomUUID()}`;
    await prisma.featureFlag.create({
      data: { key, enabled: true, rolloutPercentage: null },
    });

    const response = await request(app.getHttpServer())
      .patch(`/admin/feature-flags/${key}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: false })
      .expect(200);
    expect((response.body as { enabled: boolean }).enabled).toBe(false);

    const updated = await prisma.featureFlag.findUniqueOrThrow({
      where: { key },
    });
    expect(updated.enabled).toBe(false);
  });

  it('updating only rollout_percentage leaves enabled untouched', async () => {
    const key = `it-019-partial-${randomUUID()}`;
    await prisma.featureFlag.create({
      data: { key, enabled: true, rolloutPercentage: 10 },
    });

    await request(app.getHttpServer())
      .patch(`/admin/feature-flags/${key}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rollout_percentage: 90 })
      .expect(200);

    const updated = await prisma.featureFlag.findUniqueOrThrow({
      where: { key },
    });
    expect(updated.enabled).toBe(true);
    expect(updated.rolloutPercentage).toBe(90);
  });

  it('PATCH for an unknown key returns 404', async () => {
    await request(app.getHttpServer())
      .patch(`/admin/feature-flags/${randomUUID()}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: false })
      .expect(404);
  });
});
