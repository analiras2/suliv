import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { RecipeAuthoringPayload } from '@/module/recipe-authoring/types';
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
import { recipeAuthoringService } from '@/module/recipe-authoring/services/recipe-authoring-service';

function buildPayload(): RecipeAuthoringPayload {
  return {
    id: 'recipe-1',
    title: 'Bolo',
    description: 'Descrição',
    categoryId: 'cat-1',
    prepTimeMinutes: 30,
    servings: 4,
    difficulty: 'iniciante',
    dietPreference: 'vegano',
    ingredients: [],
    steps: [],
  };
}

describe('recipeAuthoringService', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    resetFakeAuth();
    fetchMock = installFetchMock();
  });

  it('create() POSTs to /recipes with the payload and the bearer token', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'recipe-1' }));

    await recipeAuthoringService.create(buildPayload());

    const request = lastRequest(fetchMock);
    expect(request.url).toBe(`${API_TEST_BASE_URL}/recipes`);
    expect(request.init.method).toBe('POST');
    expect(request.headers).toEqual({ ...BEARER_HEADER, 'Content-Type': 'application/json' });
    expect(request.body).toBe(JSON.stringify(buildPayload()));
  });

  it('update() PATCHes /recipes/:id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'recipe-1' }));

    await recipeAuthoringService.update('recipe-1', { title: 'Novo título' });

    const request = lastRequest(fetchMock);
    expect(request.url).toBe(`${API_TEST_BASE_URL}/recipes/recipe-1`);
    expect(request.init.method).toBe('PATCH');
    expect(request.body).toBe(JSON.stringify({ title: 'Novo título' }));
  });

  it('submit() POSTs to /recipes/:id/submit', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'recipe-1' }));

    await recipeAuthoringService.submit('recipe-1');

    const request = lastRequest(fetchMock);
    expect(request.url).toBe(`${API_TEST_BASE_URL}/recipes/recipe-1/submit`);
    expect(request.init.method).toBe('POST');
  });

  // derived UT-010: rate-limit surfacing — the service must let the coded 429 through
  it('submit() rejects with RECIPE_SUBMISSION_RATE_LIMITED on the 6th same-day submission', async () => {
    fetchMock.mockResolvedValue(apiErrorResponse(429, 'RECIPE_SUBMISSION_RATE_LIMITED'));

    await expect(recipeAuthoringService.submit('recipe-1')).rejects.toMatchObject({
      code: 'RECIPE_SUBMISSION_RATE_LIMITED',
      status: 429,
    });
  });

  // derived UT-013: delete-impact preview
  it('delete(id, false) returns the favoritesCount preview without deleting', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ favoritesCount: 3 }));

    const result = await recipeAuthoringService.delete('recipe-1', false);

    expect(result).toEqual({ favoritesCount: 3 });
    const request = lastRequest(fetchMock);
    expect(request.url).toBe(`${API_TEST_BASE_URL}/recipes/recipe-1?confirm=false`);
    expect(request.init.method).toBe('DELETE');
  });

  // derived UT-014: confirmed soft delete
  it('delete(id, true) confirms the soft delete and resolves without a body', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204 } as Response);

    const result = await recipeAuthoringService.delete('recipe-1', true);

    expect(result).toBeUndefined();
    expect(lastRequest(fetchMock).url).toBe(`${API_TEST_BASE_URL}/recipes/recipe-1?confirm=true`);
  });

  it('listMine() GETs /me/recipes with status and cursor query params', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [], nextCursor: null }));

    await recipeAuthoringService.listMine('aprovada', 'cursor-1');

    expect(lastRequest(fetchMock).url).toBe(`${API_TEST_BASE_URL}/me/recipes?status=aprovada&cursor=cursor-1`);
  });

  it('listCategories() GETs /categories', async () => {
    const categories = [{ id: 'cat-1', key: 'cafe_da_manha', label: 'Café' }];
    fetchMock.mockResolvedValue(jsonResponse(categories));

    await expect(recipeAuthoringService.listCategories()).resolves.toEqual(categories);

    expect(lastRequest(fetchMock).url).toBe(`${API_TEST_BASE_URL}/categories`);
  });

  it('a coded failure rejects with the API code and status', async () => {
    fetchMock.mockResolvedValue(apiErrorResponse(404, 'RECIPE_NOT_FOUND'));

    await expect(recipeAuthoringService.listMine()).rejects.toMatchObject({ code: 'RECIPE_NOT_FOUND', status: 404 });
  });
});
