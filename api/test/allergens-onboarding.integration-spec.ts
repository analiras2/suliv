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

interface AllergenResponseBody {
  id: string;
  name: string;
}

interface UserResponseBody {
  id: string;
  dietPreference: string | null;
  cookingLevel: string | null;
  cookingFrequency: string | null;
  onboardingCompletedAt: string | null;
}

describe('Allergens & Onboarding (integration)', () => {
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

  beforeEach(async () => {
    jest.clearAllMocks();
    supabaseAdmin.deleteUser.mockResolvedValue(undefined);
    await prisma.userAllergy.deleteMany();
    await prisma.user.deleteMany();
    await prisma.allergen.deleteMany({ where: { status: 'pending' } });
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

  function bootstrap(userId: string) {
    return request(app.getHttpServer())
      .post('/me/bootstrap')
      .set('Authorization', `Bearer ${tokenFor(userId)}`)
      .send({});
  }

  it('IT-007 returns exactly the 7 seeded approved allergens, excluding pending ones', async () => {
    await prisma.allergen.create({
      data: { name: 'Termo pendente de teste', status: 'pending' },
    });

    const response = await request(app.getHttpServer())
      .get('/allergens?status=approved')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .expect(200);

    const body = response.body as AllergenResponseBody[];
    expect(body).toHaveLength(7);
    expect(body.every((allergen) => typeof allergen.id === 'string')).toBe(true);
    expect(body.map((allergen) => allergen.name)).not.toContain(
      'Termo pendente de teste',
    );
  });

  it('IT-008 happy path creates UserAllergy and pending Allergen rows, sets onboardingCompletedAt', async () => {
    await bootstrap('user-1').expect(201);
    const leite = await prisma.allergen.findFirstOrThrow({
      where: { name: 'Leite', status: 'approved' },
    });

    const response = await request(app.getHttpServer())
      .post('/me/onboarding')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({
        diet_preference: 'vegano',
        allergen_ids: [leite.id],
        new_terms: ['quinoa em pó'],
        cooking_level: 'iniciante',
        cooking_frequency: 'raramente',
      })
      .expect(201);

    const body = response.body as UserResponseBody;
    expect(body.onboardingCompletedAt).not.toBeNull();
    expect(body.dietPreference).toBe('vegano');

    await expect(
      prisma.userAllergy.findUnique({
        where: { userId_allergenId: { userId: 'user-1', allergenId: leite.id } },
      }),
    ).resolves.not.toBeNull();

    const newTermAllergen = await prisma.allergen.findUnique({
      where: { name: 'quinoa em pó' },
    });
    expect(newTermAllergen?.status).toBe('pending');
    await expect(
      prisma.userAllergy.findUnique({
        where: {
          userId_allergenId: { userId: 'user-1', allergenId: newTermAllergen!.id },
        },
      }),
    ).resolves.not.toBeNull();
  });

  it('IT-009 does not create duplicate rows when the identical payload is retried', async () => {
    await bootstrap('user-1').expect(201);
    const leite = await prisma.allergen.findFirstOrThrow({
      where: { name: 'Leite', status: 'approved' },
    });
    const payload = {
      diet_preference: 'vegano',
      allergen_ids: [leite.id],
      new_terms: ['quinoa em pó'],
      cooking_level: 'iniciante',
      cooking_frequency: 'raramente',
    };

    await request(app.getHttpServer())
      .post('/me/onboarding')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send(payload)
      .expect(201);
    await request(app.getHttpServer())
      .post('/me/onboarding')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send(payload)
      .expect(201);

    expect(
      await prisma.userAllergy.count({ where: { userId: 'user-1' } }),
    ).toBe(2);
    expect(
      await prisma.allergen.count({ where: { name: 'quinoa em pó' } }),
    ).toBe(1);
  });

  it('IT-010 rejects POST /me/onboarding without a valid JWT and writes nothing', async () => {
    await bootstrap('user-1').expect(201);
    const leite = await prisma.allergen.findFirstOrThrow({
      where: { name: 'Leite', status: 'approved' },
    });

    await request(app.getHttpServer())
      .post('/me/onboarding')
      .send({
        diet_preference: 'vegano',
        allergen_ids: [leite.id],
        new_terms: ['quinoa em pó'],
        cooking_level: 'iniciante',
        cooking_frequency: 'raramente',
      })
      .expect(401);

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: 'user-1' },
    });
    expect(user.onboardingCompletedAt).toBeNull();
    expect(
      await prisma.userAllergy.count({ where: { userId: 'user-1' } }),
    ).toBe(0);
  });
});
