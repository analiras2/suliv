import {
  Controller,
  Get,
  INestApplication,
  Module,
  Post,
  UseGuards,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { RateLimit } from '../src/common/rate-limit/rate-limit.decorator';
import { RateLimitModule } from '../src/common/rate-limit/rate-limit.module';
import { environmentConfiguration } from '../src/config/environment';
import { ApiExceptionFilter } from '../src/errors/api-exception.filter';
import { PrismaModule } from '../src/prisma/prisma.module';

const TEST_ACTION = 'test_action';
const TEST_LIMIT = 3;
const FAILING_ACTION = 'failing_action';
const USER_HEADER = 'x-test-user';

// Test-only guard: the user id comes from a header, no JWT involved.
class HeaderUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string>; user?: unknown }>();
    req.user = { id: req.headers[USER_HEADER] };
    return true;
  }
}

@Controller('test-rate-limited')
@UseGuards(HeaderUserGuard)
class TestRateLimitedController {
  @Post()
  @RateLimit(TEST_ACTION, TEST_LIMIT, 'day')
  create(): { ok: true } {
    return { ok: true };
  }

  @Get('fails')
  @RateLimit(FAILING_ACTION, 1, 'day')
  fails(): never {
    throw new Error('handler failed');
  }
}

@Module({
  imports: [RateLimitModule],
  controllers: [TestRateLimitedController],
})
class TestRateLimitModule {}

describe('Rate limit (integration)', () => {
  const prisma = new PrismaClient();
  let app: INestApplication<App>;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [environmentConfiguration],
        }),
        PrismaModule,
        TestRateLimitModule,
      ],
      providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    userId = randomUUID();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(async () => {
    await prisma.rateLimitEvent.deleteMany({
      where: { action: { in: [TEST_ACTION, FAILING_ACTION] } },
    });
    await app.close();
    await prisma.$disconnect();
  });

  function post() {
    return request(app.getHttpServer())
      .post('/test-rate-limited')
      .set(USER_HEADER, userId);
  }

  // IT-001
  it('serves the first three calls and answers 429 on the fourth', async () => {
    for (let call = 0; call < TEST_LIMIT; call += 1) {
      await post().expect(201);
    }

    const rejected = await post().expect(429);

    expect((rejected.body as { code: string }).code).toBe('RATE_LIMITED');
    await expect(
      prisma.rateLimitEvent.count({ where: { userId, action: TEST_ACTION } }),
    ).resolves.toBe(TEST_LIMIT);
  });

  // IT-002
  it('allows the user again once the clock moves to the next day', async () => {
    for (let call = 0; call < TEST_LIMIT; call += 1) {
      await post().expect(201);
    }
    await post().expect(429);

    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    jest.useFakeTimers({
      now: tomorrow,
      doNotFake: [
        'nextTick',
        'setImmediate',
        'setTimeout',
        'setInterval',
        'clearTimeout',
        'clearInterval',
      ],
    });

    await post().expect(201);
  });

  it('does not consume the quota when the handler fails', async () => {
    const fails = () =>
      request(app.getHttpServer())
        .get('/test-rate-limited/fails')
        .set(USER_HEADER, userId);

    await fails().expect(500);
    await fails().expect(500);

    await expect(
      prisma.rateLimitEvent.count({
        where: { userId, action: FAILING_ACTION },
      }),
    ).resolves.toBe(0);
  });
});
