import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { createValidationPipe } from '../src/errors/validation-exception.factory';
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

const ISSUER_PATH = '/auth/v1';
const HALF_ROLLOUT = 50;
const USER_SAMPLE_SIZE = 40;

describe('Feature flags (integration)', () => {
  const prisma = new PrismaClient();
  const trustedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const flagKey = `it_flag_${randomUUID()}`;
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
      .useValue({ deleteUser: jest.fn() })
      .compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(createValidationPipe());
    await app.init();

    await prisma.featureFlag.create({
      data: { key: flagKey, enabled: true, rolloutPercentage: HALF_ROLLOUT },
    });
  });

  afterAll(async () => {
    await prisma.featureFlag.deleteMany({ where: { key: flagKey } });
    await app.close();
    await prisma.$disconnect();
    await new Promise<void>((resolve, reject) =>
      jwksServer.close((error) => (error ? reject(error) : resolve())),
    );
  });

  function tokenFor(userId: string): string {
    return sign(
      { sub: userId, email: `${userId}@example.com` },
      trustedKeys.privateKey,
      { algorithm: 'RS256', expiresIn: '5m', issuer, keyid: 'trusted-key' },
    );
  }

  async function flagFor(userId: string): Promise<boolean> {
    const response = await request(app.getHttpServer())
      .get('/feature-flags')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .expect(200);
    return (response.body as Record<string, boolean>)[flagKey];
  }

  it('requires authentication', async () => {
    await request(app.getHttpServer()).get('/feature-flags').expect(401);
  });

  // IT-004
  it('answers consistently per user and spreads a 50% rollout across users', async () => {
    const userIds = Array.from({ length: USER_SAMPLE_SIZE }, () =>
      randomUUID(),
    );

    const firstPass: boolean[] = [];
    const secondPass: boolean[] = [];
    for (const userId of userIds) firstPass.push(await flagFor(userId));
    for (const userId of userIds) secondPass.push(await flagFor(userId));

    expect(secondPass).toEqual(firstPass);
    expect(firstPass).toContain(true);
    expect(firstPass).toContain(false);
  });
});
