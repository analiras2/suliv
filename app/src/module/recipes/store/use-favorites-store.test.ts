import { renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { RecipeDetail } from '@/module/recipes/types';

type NetInfoState = { isConnected: boolean | null };
type NetInfoListener = (state: NetInfoState) => void;
type Session = { access_token: string; user: { id: string } };
type AuthStateListener = (session: Session | null) => void;

const mockOfflineGet = jest.fn<(key: string) => unknown>();
const mockOfflineSet = jest.fn<(key: string, value: unknown) => void>();
const mockAddEventListener = jest.fn<(listener: NetInfoListener) => () => void>();
const mockGetSession = jest.fn<() => Promise<Session | null>>();
const mockOnAuthStateChange = jest.fn<(listener: AuthStateListener) => () => void>();
const mockCacheRecipeDetail = jest.fn<(slug: string, detail: RecipeDetail) => void>();
const mockEvictCachedRecipeDetail = jest.fn<(slug: string) => void>();
const mockGetCachedRecipeDetail = jest.fn<(slug: string) => (RecipeDetail & { cachedAt: string }) | null>();
const mockEnqueueAdd = jest.fn<(recipeId: string, occurredAt: string) => void>();
const mockEnqueueRemove = jest.fn<(recipeId: string, occurredAt: string) => void>();
const mockFavoritesList = jest.fn<() => Promise<{ items: unknown[]; nextCursor: string | null }>>();

let netInfoListener: NetInfoListener = () => {};
let authStateListener: AuthStateListener = () => {};

// The store subscribes to onAuthStateChange as a module-load side effect (like
// offlineCache.get() below), so this implementation must be wired before the
// require() call captures the real listener — setting it inside beforeEach
// would be too late for that first, module-load-time subscription.
mockOnAuthStateChange.mockImplementation((listener) => {
  authStateListener = listener;
  return jest.fn();
});

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
  authService: {
    getSession: () => mockGetSession(),
    onAuthStateChange: (listener: AuthStateListener) => mockOnAuthStateChange(listener),
  },
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
    mockOfflineGet.mockReturnValue(null);
    // Forces the module's internal currentUserId back to anonymous before each
    // test, since it is not part of the store state reset below.
    authStateListener(null);
    useFavoritesStore.setState({ favorites: {}, hasReconciled: false });
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

  // Issue 002: a favorite merged from GET /favorites (new device/reinstall)
  // has no local RecipeDetail cache yet — it must still render as a card.
  it('renders a server-only reconciled favorite using its summary, with no cached detail', async () => {
    netInfoListener({ isConnected: true });
    useFavoritesStore.getState().mergeFromServer([
      {
        recipeId: 'recipe-2',
        slug: 'panqueca',
        favoritedAt: '2026-07-20T10:00:00.000Z',
        title: 'Panqueca',
        coverImageUrl: null,
        category: { id: 'cat-2', key: 'cafe_da_manha', label: 'Café da manhã' },
        timeBucket: 'ate_15',
        difficulty: 'iniciante',
        dietPreference: 'vegetariano',
      },
    ]);
    mockGetCachedRecipeDetail.mockReturnValue(null);

    const { result } = await renderHook(() => useFavoritesList());

    expect(result.current.items).toEqual([
      expect.objectContaining({ id: 'recipe-2', slug: 'panqueca', title: 'Panqueca' }),
    ]);
    expect(result.current.isEmpty).toBe(false);
  });

  // Legacy entries persisted before summary fields existed on FavoriteEntry
  // have no data to render a card from and no cached detail to fall back to.
  it('drops a favorite entry with no summary data and no cached detail', async () => {
    netInfoListener({ isConnected: true });
    useFavoritesStore.getState().mergeFromServer([
      { recipeId: 'recipe-3', slug: 'torta', favoritedAt: '2026-07-20T10:00:00.000Z' },
    ]);
    mockGetCachedRecipeDetail.mockReturnValue(null);

    const { result } = await renderHook(() => useFavoritesList());

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

  // Issue 001: the persisted favorites index and in-memory store must be
  // scoped per authenticated user id, never shared across accounts.
  describe('user-scoped persistence across sign-in/sign-out', () => {
    it('signing in as a user loads that user\'s persisted favorites into the store, not another scope\'s', () => {
      netInfoListener({ isConnected: true });
      mockOfflineGet.mockImplementation((key: string) => {
        if (key === 'cache:favorites-index:user-a') {
          return {
            favorites: { 'recipe-9': { recipeId: 'recipe-9', slug: 'panqueca', favoritedAt: '2026-01-01T00:00:00.000Z' } },
            hasReconciled: true,
          };
        }
        return null;
      });

      authStateListener({ access_token: 'token-a', user: { id: 'user-a' } });

      expect(useFavoritesStore.getState().favorites).toEqual({
        'recipe-9': { recipeId: 'recipe-9', slug: 'panqueca', favoritedAt: '2026-01-01T00:00:00.000Z' },
      });
      expect(useFavoritesStore.getState().hasReconciled).toBe(true);
    });

    it('user B never inherits user A\'s favorites when signing in on the same device', () => {
      netInfoListener({ isConnected: true });
      mockOfflineGet.mockImplementation((key: string) => {
        if (key === 'cache:favorites-index:user-a') {
          return {
            favorites: { 'recipe-9': { recipeId: 'recipe-9', slug: 'panqueca', favoritedAt: '2026-01-01T00:00:00.000Z' } },
            hasReconciled: true,
          };
        }
        return null;
      });
      authStateListener({ access_token: 'token-a', user: { id: 'user-a' } });
      expect(useFavoritesStore.getState().isFavorited('recipe-9')).toBe(true);

      authStateListener({ access_token: 'token-b', user: { id: 'user-b' } });

      expect(useFavoritesStore.getState().favorites).toEqual({});
      expect(useFavoritesStore.getState().isFavorited('recipe-9')).toBe(false);
      expect(useFavoritesStore.getState().hasReconciled).toBe(false);
    });

    it('signing out after an authenticated session clears that user\'s favorites from the store', () => {
      netInfoListener({ isConnected: true });
      mockOfflineGet.mockImplementation((key: string) => {
        if (key === 'cache:favorites-index:user-a') {
          return {
            favorites: { 'recipe-9': { recipeId: 'recipe-9', slug: 'panqueca', favoritedAt: '2026-01-01T00:00:00.000Z' } },
            hasReconciled: true,
          };
        }
        return null;
      });
      authStateListener({ access_token: 'token-a', user: { id: 'user-a' } });

      authStateListener(null);

      expect(useFavoritesStore.getState().favorites).toEqual({});
      expect(useFavoritesStore.getState().hasReconciled).toBe(false);
    });

    it('persists a toggled favorite under the active authenticated user\'s scoped cache key', () => {
      netInfoListener({ isConnected: true });
      mockOfflineGet.mockReturnValue(null);
      authStateListener({ access_token: 'token-b', user: { id: 'user-b' } });

      useFavoritesStore.getState().toggleFavorite(recipe);

      expect(mockOfflineSet).toHaveBeenCalledWith(
        'cache:favorites-index:user-b',
        expect.objectContaining({
          favorites: expect.objectContaining({ [recipe.id]: expect.any(Object) }),
        }),
      );
    });
  });
});
