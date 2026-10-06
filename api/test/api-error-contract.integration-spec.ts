import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { generateKeyPairSync } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { createValidationPipe } from '../src/errors/validation-exception.factory';
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

const ISSUER_PATH = '/auth/v1';
const INTERNAL_FAILURE_MESSAGE = 'boom';

@Controller('test-only')
class FailingController {
  @Get('boom')
  boom(): never {
    throw new Error(INTERNAL_FAILURE_MESSAGE);
  }
}

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: { field: string; constraint: string }[];
}

jest.setTimeout(20_000);

describe('API error contract (integration)', () => {
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
      controllers: [FailingController],
    })
      .overrideProvider(SupabaseAdminService)
      .useValue(supabaseAdmin)
      .compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(createValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await new Promise<void>((resolve, reject) =>
      jwksServer.close((error) => (error ? reject(error) : resolve())),
    );
  });

  function tokenFor(userId: string): string {
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

  it('IT-003 answers an unknown recipe slug with the coded 404 body', async () => {
    const response = await request(app.getHttpServer())
      .get('/recipes/slug-que-nao-existe')
      .expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      code: 'RECIPE_NOT_FOUND',
      message: 'Recipe not found',
    });
  });

  it('IT-004 answers a request without Authorization with UNAUTHORIZED', async () => {
    const response = await request(app.getHttpServer()).get('/me').expect(401);

    expect((response.body as ErrorBody).code).toBe('UNAUTHORIZED');
    expect(response.body).not.toHaveProperty('error');
  });

  it('IT-005 answers an unknown route with NOT_FOUND', async () => {
    const response = await request(app.getHttpServer())
      .get('/rota-inexistente')
      .expect(404);

    expect((response.body as ErrorBody).code).toBe('NOT_FOUND');
  });

  it('IT-006 answers an unexpected error with INTERNAL_ERROR and no internal detail', async () => {
    const response = await request(app.getHttpServer())
      .get('/test-only/boom')
      .expect(500);

    expect(response.body).toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
    expect(JSON.stringify(response.body)).not.toContain(
      INTERNAL_FAILURE_MESSAGE,
    );
  });

  it('IT-007 reports VALIDATION_FAILED details for admin login', async () => {
    const response = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email: 'x', extra: 1 })
      .expect(400);

    const body = response.body as ErrorBody;
    expect(body.code).toBe('VALIDATION_FAILED');
    expect(body.details).toEqual(
      expect.arrayContaining([
        { field: 'email', constraint: 'isEmail' },
        { field: 'extra', constraint: 'whitelistValidation' },
      ]),
    );
  });

  // The ingredient DTO validates `name` with IsString only (ADR-003 keeps DTOs
  // unchanged), so a missing name is the nested failure the pipe can report.
  it('IT-008 reports a dotted path for a nested recipe payload failure', async () => {
    const response = await request(app.getHttpServer())
      .post('/recipes')
      .set('Authorization', `Bearer ${tokenFor('it-008-error-contract')}`)
      .send({ ingredients: [{}] })
      .expect(400);

    const body = response.body as ErrorBody;
    expect(body.code).toBe('VALIDATION_FAILED');
    expect(body.details).toContainEqual({
      field: 'ingredients.0.name',
      constraint: 'isString',
    });
  });
});
