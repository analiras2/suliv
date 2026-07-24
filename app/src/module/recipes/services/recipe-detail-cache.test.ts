import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { RecipeDetail } from '@/module/recipes/types';

const mockGet = jest.fn<(key: string) => unknown>();
const mockSet = jest.fn<(key: string, value: unknown) => void>();
const mockRemove = jest.fn<(key: string) => void>();

jest.mock('@/lib/offline-cache', () => ({
  offlineCache: {
    get: (key: string) => mockGet(key),
    set: (key: string, value: unknown) => mockSet(key, value),
    remove: (key: string) => mockRemove(key),
  },
}));

// eslint-disable-next-line import/first
import { cacheRecipeDetail, evictCachedRecipeDetail, getCachedRecipeDetail } from './recipe-detail-cache';

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

describe('recipe-detail-cache', () => {
  let stored: Record<string, unknown>;

  beforeEach(() => {
    jest.clearAllMocks();
    stored = {};
    mockGet.mockImplementation((key: string) => stored[key] ?? null);
    mockSet.mockImplementation((key: string, value: unknown) => {
      stored[key] = value;
    });
    mockRemove.mockImplementation((key: string) => {
      delete stored[key];
    });
  });

  // UT-005
  it('keeps a cached recipe detail offline-readable with no network call after cacheRecipeDetail', () => {
    cacheRecipeDetail(detail.slug, detail);

    const cached = getCachedRecipeDetail(detail.slug);

    expect(cached).toEqual({ ...detail, cachedAt: expect.any(String) });
    expect(mockGet).toHaveBeenCalledWith(`cache:recipe-detail:${detail.slug}`);
  });

  it('removes the cached entry for a slug on evictCachedRecipeDetail', () => {
    cacheRecipeDetail(detail.slug, detail);

    evictCachedRecipeDetail(detail.slug);

    expect(mockRemove).toHaveBeenCalledWith(`cache:recipe-detail:${detail.slug}`);
    expect(getCachedRecipeDetail(detail.slug)).toBeNull();
  });

  it('is a no-op when evicting a slug that was never cached', () => {
    expect(() => evictCachedRecipeDetail('never-cached')).not.toThrow();
    expect(mockRemove).toHaveBeenCalledWith('cache:recipe-detail:never-cached');
  });

  // UT-025
  it('round-trips a cached recipe detail with a cachedAt timestamp added', () => {
    cacheRecipeDetail(detail.slug, detail);

    const cached = getCachedRecipeDetail(detail.slug);

    expect(cached).toEqual({ ...detail, cachedAt: expect.any(String) });
    expect(mockSet).toHaveBeenCalledWith(
      `cache:recipe-detail:${detail.slug}`,
      expect.objectContaining({ detail, cachedAt: expect.any(String) }),
    );
  });

  // UT-026
  it('returns null for a slug that was never cached', () => {
    expect(getCachedRecipeDetail('never-cached')).toBeNull();
  });

  // UT-026
  it('returns null when the underlying cache read yields a corrupted entry', () => {
    // offlineCache.get already degrades a corrupted MMKV entry to null (see offline-cache.ts);
    // recipe-detail-cache must pass that miss through rather than throwing.
    mockGet.mockReturnValue(null);

    expect(getCachedRecipeDetail(detail.slug)).toBeNull();
  });
});
