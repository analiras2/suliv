import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { RecipeDetail } from '@/module/recipes/types';
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
import { recipeDetailService } from './recipe-detail-service';

describe('recipeDetailService', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    resetFakeAuth();
    fetchMock = installFetchMock();
  });

  it('GETs /recipes/:slug with the bearer token when there is a session', async () => {
    const recipe = { id: 'recipe-1' } as RecipeDetail;
    fetchMock.mockResolvedValue(jsonResponse(recipe));

    await expect(recipeDetailService.fetchBySlug('panqueca')).resolves.toEqual(recipe);

    const request = lastRequest(fetchMock);
    expect(request.url).toBe(`${API_TEST_BASE_URL}/recipes/panqueca`);
    expect(request.headers).toEqual(BEARER_HEADER);
  });

  it('still reads a public recipe without a session and sends no Authorization header', async () => {
    resetFakeAuth(null);
    fetchMock.mockResolvedValue(jsonResponse({ id: 'recipe-1' }));

    await recipeDetailService.fetchBySlug('panqueca');

    expect(lastRequest(fetchMock).headers).not.toHaveProperty('Authorization');
  });

  it('rejects with RECIPE_NOT_FOUND for an unknown slug', async () => {
    fetchMock.mockResolvedValue(apiErrorResponse(404, 'RECIPE_NOT_FOUND'));

    await expect(recipeDetailService.fetchBySlug('nao-existe')).rejects.toMatchObject({
      code: 'RECIPE_NOT_FOUND',
      status: 404,
    });
  });
});
