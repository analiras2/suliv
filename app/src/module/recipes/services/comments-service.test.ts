import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  API_TEST_BASE_URL,
  apiErrorResponse,
  BEARER_HEADER,
  installFetchMock,
  jsonResponse,
  lastRequest,
  resetFakeAuth,
} from '@/test-utils/api-test-helpers';

jest.mock('@/module/auth/services/auth-service', () => ({
  authService: require('@/test-utils/api-test-helpers').fakeAuthService,
}));

// eslint-disable-next-line import/first
import { commentsService } from './comments-service';

describe('commentsService', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    resetFakeAuth();
    fetchMock = installFetchMock();
  });

  it('lists comments with an encoded cursor and the bearer token', async () => {
    const page = { items: [], nextCursor: null };
    fetchMock.mockResolvedValue(jsonResponse(page));

    await expect(commentsService.list('recipe-1', 'a b')).resolves.toEqual(page);

    const request = lastRequest(fetchMock);
    expect(request.url).toBe(`${API_TEST_BASE_URL}/recipes/recipe-1/comments?cursor=a%20b`);
    expect(request.headers).toEqual(BEARER_HEADER);
  });

  it('lists comments without a session and sends no Authorization header', async () => {
    resetFakeAuth(null);
    fetchMock.mockResolvedValue(jsonResponse({ items: [], nextCursor: null }));

    await commentsService.list('recipe-1');

    const request = lastRequest(fetchMock);
    expect(request.url).toBe(`${API_TEST_BASE_URL}/recipes/recipe-1/comments`);
    expect(request.headers).not.toHaveProperty('Authorization');
  });

  it('reads the own review from /comments/me', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null));

    await expect(commentsService.getOwn('recipe-1')).resolves.toBeNull();

    expect(lastRequest(fetchMock).url).toBe(`${API_TEST_BASE_URL}/recipes/recipe-1/comments/me`);
  });

  it('POSTs the snake_case body when upserting', async () => {
    const saved = { id: 'comment-1' };
    fetchMock.mockResolvedValue(jsonResponse(saved));

    await expect(commentsService.upsert('recipe-1', { rating: 4, commentText: 'bom' })).resolves.toBe(saved);

    const request = lastRequest(fetchMock);
    expect(request.init.method).toBe('POST');
    expect(request.headers).toEqual({ ...BEARER_HEADER, 'Content-Type': 'application/json' });
    expect(request.body).toBe(JSON.stringify({ rating: 4, comment_text: 'bom' }));
  });

  it('DELETEs a comment without parsing a body', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204 } as Response);

    await expect(commentsService.remove('comment-1')).resolves.toBeUndefined();

    const request = lastRequest(fetchMock);
    expect(request.url).toBe(`${API_TEST_BASE_URL}/comments/comment-1`);
    expect(request.init.method).toBe('DELETE');
  });

  it('rejects with the API code when the daily limit is reached', async () => {
    fetchMock.mockResolvedValue(apiErrorResponse(429, 'COMMENT_RATE_LIMITED'));

    await expect(commentsService.upsert('recipe-1', { rating: 4 })).rejects.toMatchObject({
      code: 'COMMENT_RATE_LIMITED',
      status: 429,
    });
  });
});
