import { Controller, Get, INestApplication, Query } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PaginationCursorService } from '../src/common/pagination/pagination-cursor.service';
import { PaginationModule } from '../src/common/pagination/pagination.module';
import { ApiExceptionFilter } from '../src/errors/api-exception.filter';
import { environmentConfiguration } from '../src/config/environment';
import { APP_FILTER } from '@nestjs/core';

const PAGE_SIZE = 3;
const TOTAL_ITEMS = 8;
const ITEMS = Array.from({ length: TOTAL_ITEMS }, (_, index) => ({
  id: `item-${String(index).padStart(2, '0')}`,
  score: TOTAL_ITEMS - index,
}));

interface TestPage {
  items: typeof ITEMS;
  nextCursor: string | null;
}

// Test-only endpoint: items sorted by score descending, keyset-paginated.
@Controller('test-paginated')
class TestPaginatedController {
  constructor(private readonly cursors: PaginationCursorService) {}

  @Get()
  list(@Query('cursor') cursor?: string): TestPage {
    const after = cursor ? this.cursors.decodeOrThrow(cursor) : null;
    const remaining = after
      ? ITEMS.filter((item) => item.score < Number(after.sortValue))
      : ITEMS;
    const items = remaining.slice(0, PAGE_SIZE);
    const last = items[items.length - 1];
    const hasMore = remaining.length > PAGE_SIZE;

    return {
      items,
      nextCursor:
        hasMore && last
          ? this.cursors.encode({ sortValue: last.score, id: last.id })
          : null,
    };
  }
}

describe('Pagination cursor (integration)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.PAGINATION_CURSOR_SECRET = 'integration-cursor-secret';
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [environmentConfiguration],
        }),
        PaginationModule,
      ],
      controllers: [TestPaginatedController],
      providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // IT-003
  it('continues page 2 right after page 1 with no overlap or gap', async () => {
    const server = app.getHttpServer();
    const seen: string[] = [];
    let cursor: string | null = null;

    do {
      const response = await request(server)
        .get('/test-paginated')
        .query(cursor ? { cursor } : {})
        .expect(200);
      const page = response.body as TestPage;
      seen.push(...page.items.map((item) => item.id));
      cursor = page.nextCursor;
    } while (cursor);

    expect(seen).toEqual(ITEMS.map((item) => item.id));
  });

  it('answers 400 BAD_REQUEST for a tampered cursor', async () => {
    const first = await request(app.getHttpServer())
      .get('/test-paginated')
      .expect(200);
    const { nextCursor } = first.body as TestPage;

    const response = await request(app.getHttpServer())
      .get('/test-paginated')
      .query({ cursor: `x${nextCursor}` })
      .expect(400);

    expect((response.body as { code: string }).code).toBe('BAD_REQUEST');
  });
});
