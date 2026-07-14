import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DevicePlatform, PrismaClient } from '@prisma/client';
import { generateKeyPairSync } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

const ISSUER_PATH = '/auth/v1';
const DAY_MS = 24 * 60 * 60 * 1000;

interface BootstrapResponseBody {
  missingName: boolean;
  user: { name: string | null; username: string };
}

interface UserResponseBody {
  id: string;
  email: string;
  name: string | null;
  username: string;
  status: string;
  dietPreference: string | null;
  termsVersionAccepted: string | null;
  termsAcceptedAt: string | null;
}

describe('UsersController (integration)', () => {
  const prisma = new PrismaClient();
  const trustedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const unrelatedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
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

  beforeEach(async () => {
    jest.clearAllMocks();
    supabaseAdmin.deleteUser.mockResolvedValue(undefined);
    await prisma.analyticsEvent.deleteMany();
    await prisma.deviceToken.deleteMany();
    await prisma.userAllergy.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.user.deleteMany();
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

  function bootstrap(userId: string, name?: string) {
    return request(app.getHttpServer())
      .post('/me/bootstrap')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send(name ? { name } : {});
  }

  it('IT-001 bootstraps a missing user', async () => {
    const response = await bootstrap('user-1').expect(201);
    const body = response.body as BootstrapResponseBody;
    expect(body.missingName).toBe(true);
    await expect(
      prisma.user.findUnique({ where: { id: 'user-1' } }),
    ).resolves.toEqual(expect.objectContaining({ id: 'user-1' }));
  });

  it('IT-002 bootstraps idempotently without overwriting stored data', async () => {
    const first = await bootstrap('user-1', 'Ana').expect(201);
    const second = await bootstrap('user-1', 'Changed').expect(201);
    const firstBody = first.body as BootstrapResponseBody;
    const secondBody = second.body as BootstrapResponseBody;
    expect(secondBody.user).toEqual(firstBody.user);
    expect(await prisma.user.count({ where: { id: 'user-1' } })).toBe(1);
  });

  it('IT-003 rejects GET /me without authorization', async () => {
    await request(app.getHttpServer()).get('/me').expect(401);
  });

  it.each([
    ['post', '/me/bootstrap'],
    ['get', '/me'],
    ['patch', '/me'],
    ['post', '/me/terms-acceptance'],
    ['delete', '/me'],
  ] as const)('guards %s %s without authorization', async (method, path) => {
    await request(app.getHttpServer())[method](path).expect(401);
  });

  it('IT-004 rejects a JWT signed by an unrelated key', async () => {
    const token = sign(
      { sub: 'user-1', email: 'ana@example.com' },
      unrelatedKeys.privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '5m',
        issuer,
        keyid: 'trusted-key',
      },
    );
    await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('IT-005 returns the authenticated user profile', async () => {
    await bootstrap('user-1', 'Ana').expect(201);
    const response = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(200);
    const body = response.body as UserResponseBody;
    expect(body).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'user-1@example.com',
        name: 'Ana',
        dietPreference: null,
      }),
    );
  });

  it('IT-006 returns 409 when another user owns the username', async () => {
    await bootstrap('user-1').expect(201);
    await bootstrap('user-2').expect(201);
    await prisma.user.update({
      where: { id: 'user-2' },
      data: { username: 'existing_user' },
    });
    await request(app.getHttpServer())
      .patch('/me')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({ username: 'existing_user' })
      .expect(409);
  });

  it('IT-007 returns 422 while the username cooldown is active', async () => {
    await bootstrap('user-1').expect(201);
    await prisma.user.update({
      where: { id: 'user-1' },
      data: { usernameUpdatedAt: new Date(Date.now() - 5 * DAY_MS) },
    });
    await request(app.getHttpServer())
      .patch('/me')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({ username: 'new_username' })
      .expect(422);
  });

  it('IT-008 reflects accepted terms in a subsequent profile read', async () => {
    await bootstrap('user-1').expect(201);
    await request(app.getHttpServer())
      .post('/me/terms-acceptance')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({ termsVersion: 'v3' })
      .expect(200);
    const response = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(200);
    const body = response.body as UserResponseBody;
    expect(body.termsVersionAccepted).toBe('v3');
    expect(typeof body.termsAcceptedAt).toBe('string');
  });

  it('IT-009 anonymizes the account and clears private relations', async () => {
    await bootstrap('user-1', 'Ana').expect(201);
    await prisma.userAllergy.create({
      data: { userId: 'user-1', allergenId: 'allergen-1' },
    });
    await prisma.deviceToken.create({
      data: {
        userId: 'user-1',
        token: 'device-token',
        platform: DevicePlatform.ios,
      },
    });
    await prisma.analyticsEvent.create({
      data: {
        userId: 'user-1',
        sessionId: 'session-1',
        platform: DevicePlatform.ios,
        appVersion: '1.0.0',
        eventName: 'login_success',
        properties: {},
        occurredAt: new Date(),
      },
    });

    await request(app.getHttpServer())
      .delete('/me')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(202);
    const response = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(200);
    const body = response.body as UserResponseBody;
    expect(body.name).toBeNull();
    expect(body.username).toMatch(/^removed_/);
    expect(body.status).toBe('anonymized');
    expect(
      await prisma.userAllergy.count({ where: { userId: 'user-1' } }),
    ).toBe(0);
    expect(
      await prisma.deviceToken.count({ where: { userId: 'user-1' } }),
    ).toBe(0);
    expect(
      await prisma.analyticsEvent.count({ where: { userId: 'user-1' } }),
    ).toBe(0);
    expect(supabaseAdmin.deleteUser).toHaveBeenCalledWith('user-1');
  });

  it('IT-010 preserves authored recipes after account deletion', async () => {
    await bootstrap('user-1').expect(201);
    const recipe = await prisma.recipe.create({
      data: { authorId: 'user-1', title: 'Soup' },
    });
    await request(app.getHttpServer())
      .delete('/me')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(202);
    await expect(
      prisma.recipe.findUnique({ where: { id: recipe.id } }),
    ).resolves.toEqual(expect.objectContaining({ authorId: 'user-1' }));
  });

  it('resolves concurrent username claims with one 200 and one 409', async () => {
    await bootstrap('user-1').expect(201);
    await bootstrap('user-2').expect(201);
    const responses = await Promise.all([
      request(app.getHttpServer())
        .patch('/me')
        .set('Authorization', `Bearer ${tokenFor('user-1')}`)
        .send({ username: 'shared_name' }),
      request(app.getHttpServer())
        .patch('/me')
        .set('Authorization', `Bearer ${tokenFor('user-2')}`)
        .send({ username: 'shared_name' }),
    ]);
    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
  });
});
