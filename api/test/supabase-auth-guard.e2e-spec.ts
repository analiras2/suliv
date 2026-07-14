import { Controller, Get, INestApplication, UseGuards } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { generateKeyPairSync } from 'node:crypto';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../src/auth/auth.module';
import { SupabaseAuthGuard } from '../src/auth/supabase-auth.guard';
import {
  environmentConfiguration,
  environmentValidationSchema,
} from '../src/config/environment';

@Controller('protected')
class ProtectedController {
  @Get()
  @UseGuards(SupabaseAuthGuard)
  getProtectedResource(): string {
    return 'protected';
  }
}

describe('SupabaseAuthGuard (e2e)', () => {
  let app: INestApplication<App>;
  let jwksServer: Server;

  beforeAll(async () => {
    const trustedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
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
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@127.0.0.1:5432/suliv?schema=public';
    process.env.SUPABASE_URL = `http://127.0.0.1:${port}`;
    process.env.SUPABASE_JWKS_URL = `http://127.0.0.1:${port}/jwks.json`;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [environmentConfiguration],
          validationSchema: environmentValidationSchema,
        }),
        AuthModule,
      ],
      controllers: [ProtectedController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await new Promise<void>((resolve, reject) => {
      jwksServer.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('rejects a syntactically valid JWT signed by an unrelated key', async () => {
    const unrelatedKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const token = sign(
      { sub: 'uuid-123', email: 'a@b.com' },
      unrelatedKeys.privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '5m',
        issuer: `${process.env.SUPABASE_URL}/auth/v1`,
        keyid: 'trusted-key',
      },
    );

    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });
});
