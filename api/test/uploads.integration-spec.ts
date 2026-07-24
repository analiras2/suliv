import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { generateKeyPairSync } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SupabaseAdminService } from '../src/users/supabase-admin.service';

const ISSUER_PATH = '/auth/v1';

interface UploadSignatureResponseBody {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  uploadPreset: string;
}

describe('POST /uploads/recipe-image-signature (integration)', () => {
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

  it('IT-003 returns 200 with the signature payload and no raw API secret, for an authenticated request', async () => {
    const response = await request(app.getHttpServer())
      .post('/uploads/recipe-image-signature')
      .set('Authorization', `Bearer ${tokenFor('it-003-uploads-user')}`)
      .send();

    expect(response.status).toBe(200);
    const body = response.body as UploadSignatureResponseBody;
    expect(Object.keys(body).sort()).toEqual(
      ['apiKey', 'cloudName', 'signature', 'timestamp', 'uploadPreset'].sort(),
    );
    expect(typeof body.signature).toBe('string');
    expect(typeof body.timestamp).toBe('number');
    expect(typeof body.apiKey).toBe('string');
    expect(typeof body.cloudName).toBe('string');
    expect(typeof body.uploadPreset).toBe('string');

    const responseText = JSON.stringify(body);
    expect(responseText).not.toContain(process.env.CLOUDINARY_API_SECRET);
  });

  it('rejects an unauthenticated request', async () => {
    const response = await request(app.getHttpServer())
      .post('/uploads/recipe-image-signature')
      .send();

    expect(response.status).toBe(401);
  });
});
