import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { generateKeyPairSync } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

const ISSUER_PATH = '/auth/v1';

describe('POST /events (integration)', () => {
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

  function postEvents(userId: string, idempotencyKey: string) {
    return request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({
        idempotencyKey,
        events: [
          {
            sessionId: 'session-it-003',
            platform: 'ios',
            appVersion: '1.0.0',
            eventName: 'guided_cook_started',
            properties: { recipe_id: 'recipe-it-003' },
            occurredAt: new Date().toISOString(),
          },
        ],
      });
  }

  it('IT-003 replaying the same idempotencyKey inserts nothing further on the second call', async () => {
    const user = 'it-003-events-user';
    await onboard(user);

    const first = await postEvents(user, 'it-003-key-1');
    expect(first.status).toBe(200);

    const eventsAfterFirst = await prisma.analyticsEvent.count({
      where: { userId: user, eventName: 'guided_cook_started' },
    });
    const syncOpsAfterFirst = await prisma.syncOperation.count({
      where: { userId: user, idempotencyKey: 'it-003-key-1' },
    });
    expect(eventsAfterFirst).toBe(1);
    expect(syncOpsAfterFirst).toBe(1);

    const second = await postEvents(user, 'it-003-key-1');
    expect(second.status).toBe(200);

    const eventsAfterSecond = await prisma.analyticsEvent.count({
      where: { userId: user, eventName: 'guided_cook_started' },
    });
    const syncOpsAfterSecond = await prisma.syncOperation.count({
      where: { userId: user, idempotencyKey: 'it-003-key-1' },
    });
    expect(eventsAfterSecond).toBe(1);
    expect(syncOpsAfterSecond).toBe(1);
  });
});
