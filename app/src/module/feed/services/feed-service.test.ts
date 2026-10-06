import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { FeedResponse } from '@/module/feed/types';
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
import { feedService } from './feed-service';

describe('feedService', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    resetFakeAuth();
    fetchMock = installFetchMock();
  });

  it('GETs /feed with the session bearer token', async () => {
    const feed = { selectedForYou: [], categories: [], topOfWeek: [] } as unknown as FeedResponse;
    fetchMock.mockResolvedValue(jsonResponse(feed));

    await expect(feedService.fetchFeed()).resolves.toEqual(feed);

    const request = lastRequest(fetchMock);
    expect(request.url).toBe(`${API_TEST_BASE_URL}/feed`);
    expect(request.init.method).toBe('GET');
    expect(request.headers).toEqual(BEARER_HEADER);
  });

  it('rejects with the API code when the request fails', async () => {
    fetchMock.mockResolvedValue(apiErrorResponse(500, 'INTERNAL_ERROR'));

    await expect(feedService.fetchFeed()).rejects.toMatchObject({ code: 'INTERNAL_ERROR', status: 500 });
  });

  it('rejects with UNAUTHORIZED without calling the API when there is no session', async () => {
    resetFakeAuth(null);

    await expect(feedService.fetchFeed()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
