import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { NotificationsService } from '../src/notifications/notifications.service';
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

const ISSUER_PATH = '/auth/v1';
// Any guarded /admin/* route works — the guard rejects before the handler
// runs, so an unseeded id is fine for the rejection-contract assertions.
const GUARDED_ADMIN_ROUTE = `/admin/recipes/${randomUUID()}`;

// Integration requests share a local Postgres/JWKS environment and need a
// less aggressive deadline than Jest's unit-test default.
jest.setTimeout(20_000);

describe('Admin auth (integration)', () => {
  const prisma = new PrismaClient();
  const trustedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const supabaseAdmin = { deleteUser: jest.fn<Promise<void>, [string]>() };
  const notificationsSend = jest
    .fn<Promise<void>, [string, string, Record<string, unknown>]>()
    .mockResolvedValue(undefined);
  let app: INestApplication<App>;
  let jwksServer: Server;
  let issuer: string;
  let adminEmail: string;

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
      .overrideProvider(NotificationsService)
      .useValue({ send: notificationsSend })
      .compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    adminEmail = `admin-auth-${randomUUID()}@example.com`;
    await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash: hashSync('correct-password', 10),
        role: 'moderator',
      },
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    await new Promise<void>((resolve, reject) =>
      jwksServer.close((error) => (error ? reject(error) : resolve())),
    );
  });

  function mobileTokenFor(userId: string): string {
    return sign(
      { sub: userId, email: `${userId}@example.com` },
      trustedKeys.privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '5m',
        issuer,
        keyid: 'trusted-key',
      },
    );
  }

  it('login resolves a token for correct credentials and rejects wrong password / nonexistent email identically', async () => {
    const successResponse = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email: adminEmail, password: 'correct-password' })
      .expect(200);
    expect((successResponse.body as { token: string }).token).toEqual(
      expect.any(String),
    );

    const wrongPasswordResponse = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email: adminEmail, password: 'wrong-password' })
      .expect(401);
    const nonexistentEmailResponse = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({
        email: `nobody-${randomUUID()}@example.com`,
        password: 'anything',
      })
      .expect(401);
    expect((wrongPasswordResponse.body as { message: string }).message).toBe(
      (nonexistentEmailResponse.body as { message: string }).message,
    );
  });

  it('IT-003 rejects an /admin/* request with no Authorization header', async () => {
    await request(app.getHttpServer()).get(GUARDED_ADMIN_ROUTE).expect(401);
  });

  it('IT-004 rejects an /admin/* request with an expired admin JWT', async () => {
    const expiredToken = sign(
      { sub: 'admin-1', role: 'moderator' },
      process.env.ADMIN_JWT_SECRET as string,
      { algorithm: 'HS256', expiresIn: '-10s' },
    );

    await request(app.getHttpServer())
      .get(GUARDED_ADMIN_ROUTE)
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('IT-005 rejects an /admin/* request with a valid, unexpired Supabase (mobile) JWT', async () => {
    const mobileToken = mobileTokenFor(`admin-auth-mobile-${randomUUID()}`);

    await request(app.getHttpServer())
      .get(GUARDED_ADMIN_ROUTE)
      .set('Authorization', `Bearer ${mobileToken}`)
      .expect(401);
  });
});
