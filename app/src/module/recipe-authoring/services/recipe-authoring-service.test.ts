import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/module/auth/services/auth-service', () => ({
  authService: { getSession: jest.fn(async () => null) },
}));

// eslint-disable-next-line import/first
import type { AuthService } from '@/module/auth/services/auth-service';
// eslint-disable-next-line import/first
import {
  createRecipeAuthoringService,
  RecipeAuthoringServiceError,
} from '@/module/recipe-authoring/services/recipe-authoring-service';
// eslint-disable-next-line import/first
import type { RecipeAuthoringPayload } from '@/module/recipe-authoring/types';

const originalFetch = global.fetch;

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
  let fetchMock: jest.Mock<(...args: Parameters<typeof fetch>) => Promise<Partial<Response>>>;
  let auth: AuthService;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    auth = { getSession: jest.fn(async () => ({ access_token: 'token' })) } as unknown as AuthService;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('create() POSTs to /recipes with the payload', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 'recipe-1' }) } as Response);
    const service = createRecipeAuthoringService(auth);

    await service.create(buildPayload());

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/recipes'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(buildPayload()) }),
    );
  });

  it('update() PATCHes /recipes/:id', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 'recipe-1' }) } as Response);
    const service = createRecipeAuthoringService(auth);

    await service.update('recipe-1', { title: 'Novo título' });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/recipes/recipe-1'),
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ title: 'Novo título' }) }),
    );
  });

  it('submit() POSTs to /recipes/:id/submit', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 'recipe-1' }) } as Response);
    const service = createRecipeAuthoringService(auth);

    await service.submit('recipe-1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/recipes/recipe-1/submit'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  // derived UT-010: rate-limit surfacing — the service must let a 429 through as a typed error
  it('submit() rejects with a 429 RecipeAuthoringServiceError on the 6th same-day submission', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429 } as Response);
    const service = createRecipeAuthoringService(auth);

    await expect(service.submit('recipe-1')).rejects.toMatchObject({ status: 429 });
    await expect(service.submit('recipe-1')).rejects.toBeInstanceOf(RecipeAuthoringServiceError);
  });

  // derived UT-013: delete-impact preview
  it('delete(id, false) returns the favoritesCount preview without deleting', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ favoritesCount: 3 }) } as Response);
    const service = createRecipeAuthoringService(auth);

    const result = await service.delete('recipe-1', false);

    expect(result).toEqual({ favoritesCount: 3 });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/recipes/recipe-1?confirm=false'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  // derived UT-014: confirmed soft delete
  it('delete(id, true) confirms the soft delete and resolves without a body', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => undefined } as Response);
    const service = createRecipeAuthoringService(auth);

    const result = await service.delete('recipe-1', true);

    expect(result).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/recipes/recipe-1?confirm=true'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('listMine() GETs /me/recipes with status and cursor query params', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ items: [], nextCursor: null }) } as Response);
    const service = createRecipeAuthoringService(auth);

    await service.listMine('aprovada', 'cursor-1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/me/recipes?status=aprovada&cursor=cursor-1'),
      expect.anything(),
    );
  });

  it('listCategories() GETs /categories', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'cat-1', key: 'cafe_da_manha', label: 'Café' }],
    } as Response);
    const service = createRecipeAuthoringService(auth);

    const result = await service.listCategories();

    expect(result).toEqual([{ id: 'cat-1', key: 'cafe_da_manha', label: 'Café' }]);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/categories'), expect.anything());
  });

  it('a non-ok response throws RecipeAuthoringServiceError with the response status', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 } as Response);
    const service = createRecipeAuthoringService(auth);

    await expect(service.listMine()).rejects.toMatchObject({ status: 404 });
  });
});
