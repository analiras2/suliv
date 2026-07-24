import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { RecipeDetail } from '@/module/recipes/types';

const mockFetchBySlug = jest.fn<(slug: string) => Promise<RecipeDetail>>();
const mockCacheRecipeDetail = jest.fn<(slug: string, detail: RecipeDetail) => void>();
const mockGetCachedRecipeDetail = jest.fn<(slug: string) => (RecipeDetail & { cachedAt: string }) | null>();

jest.mock('@/module/recipes/services/recipe-detail-service', () => ({
  recipeDetailService: { fetchBySlug: (slug: string) => mockFetchBySlug(slug) },
}));

jest.mock('@/module/recipes/services/recipe-detail-cache', () => ({
  cacheRecipeDetail: (slug: string, detail: RecipeDetail) => mockCacheRecipeDetail(slug, detail),
  getCachedRecipeDetail: (slug: string) => mockGetCachedRecipeDetail(slug),
}));

// eslint-disable-next-line import/first
import { guidedCookingContentService } from './guided-cooking-content-service';

const detail: RecipeDetail = {
  id: 'recipe-1',
  slug: 'bolo-de-cenoura',
  title: 'Bolo de cenoura',
  coverImageUrl: null,
  category: { id: 'cat-1', key: 'sobremesa', label: 'Sobremesa' },
  timeBucket: 'trinta_60',
  difficulty: 'iniciante',
  dietPreference: 'vegetariano',
  description: 'Bolo simples',
  servings: 8,
  ingredients: [],
  steps: [],
  averageRating: null,
  ratingCount: 0,
};

describe('guidedCookingContentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // UT-001
  it('load(slug, isConnected: true) fetches, opportunistically caches, and resolves online', async () => {
    mockFetchBySlug.mockResolvedValue(detail);

    const result = await guidedCookingContentService.load(detail.slug, true);

    expect(mockFetchBySlug).toHaveBeenCalledWith(detail.slug);
    expect(mockCacheRecipeDetail).toHaveBeenCalledWith(detail.slug, detail);
    expect(mockGetCachedRecipeDetail).not.toHaveBeenCalled();
    expect(result).toEqual({ kind: 'online', detail });
  });

  // UT-018
  it('confirms the opportunistic cache write via a subsequent getCachedRecipeDetail call', async () => {
    mockFetchBySlug.mockResolvedValue(detail);
    const cachedStore = new Map<string, RecipeDetail & { cachedAt: string }>();
    mockCacheRecipeDetail.mockImplementation((slug, cachedDetail) => {
      cachedStore.set(slug, { ...cachedDetail, cachedAt: '2026-07-18T00:00:00.000Z' });
    });

    await guidedCookingContentService.load(detail.slug, true);

    expect(cachedStore.get(detail.slug)).toEqual({ ...detail, cachedAt: expect.any(String) });
  });

  // UT-019
  it('load(slug, isConnected: false) with a cache hit resolves offline with no network call', async () => {
    mockGetCachedRecipeDetail.mockReturnValue({ ...detail, cachedAt: '2026-07-18T00:00:00.000Z' });

    const result = await guidedCookingContentService.load(detail.slug, false);

    expect(mockFetchBySlug).not.toHaveBeenCalled();
    expect(result).toEqual({ kind: 'offline', detail });
  });

  // UT-020
  it('load(slug, isConnected: false) with a cache miss resolves unavailable', async () => {
    mockGetCachedRecipeDetail.mockReturnValue(null);

    const result = await guidedCookingContentService.load(detail.slug, false);

    expect(mockFetchBySlug).not.toHaveBeenCalled();
    expect(result).toEqual({ kind: 'unavailable' });
  });
});
