import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { PaginatedRecipes } from '@/module/search/types';
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
import { searchService } from './search-service';

describe('searchService', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    resetFakeAuth();
    fetchMock = installFetchMock();
  });

  it('GETs /recipes/search with the origin, filters, repeated allergens and cursor', async () => {
    const page = { items: [], nextCursor: null } as unknown as PaginatedRecipes;
    fetchMock.mockResolvedValue(jsonResponse(page));

    await expect(
      searchService.search('busca', { q: 'bolo', category: 'sobremesa', allergens: ['leite', 'ovo'] }, 'cursor-1'),
    ).resolves.toEqual(page);

    const request = lastRequest(fetchMock);
    expect(request.url).toBe(
      `${API_TEST_BASE_URL}/recipes/search?origin=busca&q=bolo&category=sobremesa&allergens=leite&allergens=ovo&cursor=cursor-1`,
    );
    expect(request.init.method).toBe('GET');
    expect(request.headers).toEqual(BEARER_HEADER);
  });

  it('rejects with the API code when the request fails', async () => {
    fetchMock.mockResolvedValue(apiErrorResponse(400, 'VALIDATION_FAILED'));

    await expect(searchService.search('busca', {})).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});
