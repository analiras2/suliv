import { renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { RecipeDetail } from '@/module/recipes/types';

type NetInfoState = { isConnected: boolean | null };
type NetInfoListener = (state: NetInfoState) => void;

const mockOfflineGet = jest.fn<(key: string) => unknown>();
const mockOfflineSet = jest.fn<(key: string, value: unknown) => void>();
const mockAddEventListener = jest.fn<(listener: NetInfoListener) => () => void>();
const mockGetSession = jest.fn<() => Promise<{ access_token: string } | null>>();
const mockCacheRecipeDetail = jest.fn<(slug: string, detail: RecipeDetail) => void>();
const mockEvictCachedRecipeDetail = jest.fn<(slug: string) => void>();
const mockGetCachedRecipeDetail = jest.fn<(slug: string) => (RecipeDetail & { cachedAt: string }) | null>();
const mockEnqueueAdd = jest.fn<(recipeId: string, occurredAt: string) => void>();
const mockEnqueueRemove = jest.fn<(recipeId: string, occurredAt: string) => void>();
const mockFavoritesList = jest.fn<() => Promise<{ items: unknown[]; nextCursor: string | null }>>();

let netInfoListener: NetInfoListener = () => {};

jest.mock('@/lib/offline-cache', () => ({
  offlineCache: {
    get: (key: string) => mockOfflineGet(key),
    set: (key: string, value: unknown) => mockOfflineSet(key, value),
    remove: jest.fn(),
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: (listener: NetInfoListener) => mockAddEventListener(listener),
  },
}));

jest.mock('@/module/auth/services/auth-service', () => ({
  authService: { getSession: () => mockGetSession() },
}));

jest.mock('@/module/recipes/services/recipe-detail-cache', () => ({
  cacheRecipeDetail: (slug: string, detail: RecipeDetail) => mockCacheRecipeDetail(slug, detail),
  evictCachedRecipeDetail: (slug: string) => mockEvictCachedRecipeDetail(slug),
  getCachedRecipeDetail: (slug: string) => mockGetCachedRecipeDetail(slug),
}));

jest.mock('@/module/recipes/services/favorites-sync-service', () => ({
  favoritesSyncService: {
    enqueueAdd: (recipeId: string, occurredAt: string) => mockEnqueueAdd(recipeId, occurredAt),
    enqueueRemove: (recipeId: string, occurredAt: string) => mockEnqueueRemove(recipeId, occurredAt),
    flush: jest.fn(),
  },
}));

jest.mock('@/module/recipes/services/favorites-service', () => ({
  favoritesService: { list: () => mockFavoritesList() },
}));

// A plain require (not a hoisted ES import) so this runs after the mock
// fn consts above are assigned — the store calls offlineCache.get() as a
// module-load side effect, which would otherwise hit the mocks before they exist.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useFavoritesStore, useFavoritesList } = require('./use-favorites-store') as typeof import('./use-favorites-store');

const recipe: RecipeDetail = {
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

describe('useFavoritesStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFavoritesStore.setState({ favorites: {}, hasReconciled: false });
    mockOfflineGet.mockReturnValue(null);
    mockGetSession.mockResolvedValue(null);
    mockGetCachedRecipeDetail.mockReturnValue(null);
    mockFavoritesList.mockResolvedValue({ items: [], nextCursor: null });
    mockAddEventListener.mockImplementation((listener) => {
      netInfoListener = listener;
      return jest.fn();
    });
  });

  // UT-001
  it('toggleFavorite on a not-yet-favorited recipe updates local state instantly, online, with no network call', () => {
    netInfoListener({ isConnected: true });

    useFavoritesStore.getState().toggleFavorite(recipe);

    expect(useFavoritesStore.getState().isFavorited(recipe.id)).toBe(true);
    expect(useFavoritesStore.getState().favorites[recipe.id]).toEqual(
      expect.objectContaining({ recipeId: recipe.id, slug: recipe.slug, favoritedAt: expect.any(String) }),
    );
    expect(mockCacheRecipeDetail).toHaveBeenCalledWith(recipe.slug, recipe);
    expect(mockEnqueueAdd).toHaveBeenCalledWith(recipe.id, expect.any(String));
  });

  // UT-002
  it('toggleFavorite on a not-yet-favorited recipe updates local state instantly while offline', () => {
    netInfoListener({ isConnected: false });

    useFavoritesStore.getState().toggleFavorite(recipe);

    expect(useFavoritesStore.getState().isFavorited(recipe.id)).toBe(true);
    expect(mockCacheRecipeDetail).toHaveBeenCalledWith(recipe.slug, recipe);
    expect(mockEnqueueAdd).toHaveBeenCalledWith(recipe.id, expect.any(String));
  });

  // UT-003
  it('toggleFavorite on an already-favorited recipe removes the entry', () => {
    netInfoListener({ isConnected: true });
    useFavoritesStore.getState().toggleFavorite(recipe);

    useFavoritesStore.getState().toggleFavorite(recipe);

    expect(useFavoritesStore.getState().isFavorited(recipe.id)).toBe(false);
    expect(useFavoritesStore.getState().favorites[recipe.id]).toBeUndefined();
  });

  // UT-004
  it('toggleFavorite on an already-favorited recipe invokes evictCachedRecipeDetail with the slug', () => {
    netInfoListener({ isConnected: true });
    useFavoritesStore.getState().toggleFavorite(recipe);

    useFavoritesStore.getState().toggleFavorite(recipe);

    expect(mockEvictCachedRecipeDetail).toHaveBeenCalledWith(recipe.slug);
    expect(mockEnqueueRemove).toHaveBeenCalledWith(recipe.id, expect.any(String));
  });

  // UT-010
  it('mergeFromServer adds a missing entry to favorites', () => {
    netInfoListener({ isConnected: true });
    const entry = { recipeId: 'recipe-2', slug: 'panqueca', favoritedAt: '2026-07-20T10:00:00.000Z' };

    useFavoritesStore.getState().mergeFromServer([entry]);

    expect(useFavoritesStore.getState().favorites['recipe-2']).toEqual(entry);
  });

  // UT-011
  it('mergeFromServer never overwrites an entry that already exists locally', () => {
    netInfoListener({ isConnected: true });
    useFavoritesStore.getState().toggleFavorite(recipe);
    const localEntry = useFavoritesStore.getState().favorites[recipe.id];

    useFavoritesStore.getState().mergeFromServer([
      { recipeId: recipe.id, slug: recipe.slug, favoritedAt: '1999-01-01T00:00:00.000Z' },
    ]);

    expect(useFavoritesStore.getState().favorites[recipe.id]).toEqual(localEntry);
  });

  // UT-012
  it('reading the favorites list makes zero calls to favorites-service.list()', async () => {
    netInfoListener({ isConnected: false });
    useFavoritesStore.getState().toggleFavorite(recipe);
    mockGetCachedRecipeDetail.mockReturnValue({ ...recipe, cachedAt: '2026-07-23T00:00:00.000Z' });
    mockFavoritesList.mockClear();

    const { result } = await renderHook(() => useFavoritesList());

    expect(result.current.items).toHaveLength(1);
    expect(mockFavoritesList).not.toHaveBeenCalled();
  });

  // UT-013
  it('an empty favorites map reports the empty state with an explore CTA available', async () => {
    netInfoListener({ isConnected: true });

    const { result } = await renderHook(() => useFavoritesList());

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.items).toEqual([]);
  });

  // UT-014
  it('excludes a removida-status favorited recipe from rendered items, leaving the store entry unchanged', async () => {
    netInfoListener({ isConnected: true });
    useFavoritesStore.getState().toggleFavorite(recipe);
    mockGetCachedRecipeDetail.mockReturnValue({
      ...recipe,
      status: 'removida',
      cachedAt: '2026-07-23T00:00:00.000Z',
    });

    const { result } = await renderHook(() => useFavoritesList());

    expect(result.current.items).toEqual([]);
    expect(useFavoritesStore.getState().favorites[recipe.id]).toBeDefined();
  });
});
