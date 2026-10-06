import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  API_TEST_BASE_URL,
  BEARER_HEADER,
  installFetchMock,
  jsonResponse,
  lastRequest,
  resetFakeAuth,
} from '@/test-utils/api-test-helpers';

jest.mock('@/module/auth/services/auth-service', () => ({
  authService: require('@/test-utils/api-test-helpers').fakeAuthService,
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: async () => ({ isConnected: false }) },
}));

// eslint-disable-next-line import/first
import { favoritesService } from './favorites-service';

describe('favoritesService', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    resetFakeAuth();
    fetchMock = installFetchMock();
  });

  it('GETs /favorites with the bearer token and no query for the first page', async () => {
    const page = { items: [], nextCursor: null };
    fetchMock.mockResolvedValue(jsonResponse(page));

    await expect(favoritesService.list()).resolves.toEqual(page);

    const request = lastRequest(fetchMock);
    expect(request.url).toBe(`${API_TEST_BASE_URL}/favorites`);
    expect(request.headers).toEqual(BEARER_HEADER);
  });

  it('passes the cursor as a query parameter', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [], nextCursor: null }));

    await favoritesService.list('cursor-1');

    expect(lastRequest(fetchMock).url).toBe(`${API_TEST_BASE_URL}/favorites?cursor=cursor-1`);
  });

  it('IT-019 rejects with NETWORK_OFFLINE when there is no response and no connectivity', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    await expect(favoritesService.list()).rejects.toMatchObject({ code: 'NETWORK_OFFLINE', status: null });
  });
});
