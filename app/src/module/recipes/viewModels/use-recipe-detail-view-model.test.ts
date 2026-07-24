import type { Session } from '@supabase/supabase-js';
import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { AnalyticsClient } from '@/lib/analytics';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import type { RecipeDetail } from '@/module/recipes/types';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: mockBack }) }));
jest.mock('@/module/recipes/queries/use-recipe-detail-query', () => ({ useRecipeDetailQuery: jest.fn() }));
jest.mock('@/module/recipes/services/recipe-detail-service', () => ({
  RecipeDetailServiceError: class RecipeDetailServiceError extends Error {
    status: number;
    constructor(status: number) {
      super(`Recipe detail request failed with status ${status}.`);
      this.status = status;
    }
  },
}));

// use-favorites-store hydrates from MMKV and subscribes to NetInfo as a
// module-load side effect, so its real dependencies are stubbed here rather
// than mocking the store module itself — same pattern as use-favorites-store.test.ts.
jest.mock('@/lib/offline-cache', () => ({
  offlineCache: { get: () => null, set: jest.fn(), remove: jest.fn() },
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: () => jest.fn() },
}));
jest.mock('@/module/auth/services/auth-service', () => ({ authService: { getSession: jest.fn() } }));
jest.mock('@/module/recipes/services/recipe-detail-cache', () => ({
  cacheRecipeDetail: jest.fn(),
  evictCachedRecipeDetail: jest.fn(),
  getCachedRecipeDetail: jest.fn(() => null),
}));
jest.mock('@/module/recipes/services/favorites-sync-service', () => ({
  favoritesSyncService: { enqueueAdd: jest.fn(), enqueueRemove: jest.fn(), flush: jest.fn() },
}));
jest.mock('@/module/recipes/services/favorites-service', () => ({
  favoritesService: { list: jest.fn(async () => ({ items: [] })) },
}));

// eslint-disable-next-line import/first
import { useFavoritesStore } from '@/module/recipes/store/use-favorites-store';
// eslint-disable-next-line import/first
import { useRecipeDetailQuery } from '@/module/recipes/queries/use-recipe-detail-query';
// eslint-disable-next-line import/first
import { useRecipeDetailViewModel } from './use-recipe-detail-view-model';

const mockedUseRecipeDetailQuery = jest.mocked(useRecipeDetailQuery);

function buildRecipe(overrides: Partial<RecipeDetail> = {}): RecipeDetail {
  return {
    id: 'recipe-1',
    slug: 'receita-1',
    title: 'Receita 1',
    coverImageUrl: null,
    category: { id: 'cat-1', key: 'lanche', label: 'Lanche' },
    timeBucket: 'ate_15',
    difficulty: 'iniciante',
    dietPreference: 'vegano',
    description: 'Descrição.',
    servings: 4,
    ingredients: [],
    steps: [],
    averageRating: null,
    ratingCount: 0,
    ...overrides,
  };
}

describe('useRecipeDetailViewModel', () => {
  let analytics: jest.Mocked<AnalyticsClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    useFavoritesStore.setState({ favorites: {}, hasReconciled: false });
    analytics = { track: jest.fn() };
    mockedUseRecipeDetailQuery.mockReturnValue({
      data: buildRecipe(),
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useRecipeDetailQuery>);
  });

  async function setup(slug = 'receita-1') {
    return renderHook(() => useRecipeDetailViewModel(slug, analytics));
  }

  it('UT-012: toggleSave() while unauthenticated navigates to login and does not toggle the favorite', async () => {
    useSessionStore.setState({ session: null, user: null, status: 'unauthenticated' });
    const toggleFavoriteSpy = jest.spyOn(useFavoritesStore.getState(), 'toggleFavorite');
    const { result } = await setup();

    await act(() => {
      result.current.toggleSave();
    });

    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(toggleFavoriteSpy).not.toHaveBeenCalled();
  });

  it('UT-013: startCooking() while unauthenticated navigates to login', async () => {
    useSessionStore.setState({ session: null, user: null, status: 'unauthenticated' });
    const { result } = await setup();

    await act(() => {
      result.current.startCooking();
    });

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('UT-014: startCooking() while authenticated navigates to the cook placeholder route', async () => {
    useSessionStore.setState({
      session: { access_token: 'token' } as Session,
      user: null,
      status: 'authenticated',
    });
    const { result } = await setup('receita-1');

    await act(() => {
      result.current.startCooking();
    });

    expect(mockPush).toHaveBeenCalledWith('/recipe/receita-1/cook');
  });

  it('toggleSave() while authenticated calls useFavoritesStore.toggleFavorite with the loaded recipe', async () => {
    useSessionStore.setState({
      session: { access_token: 'token' } as Session,
      user: null,
      status: 'authenticated',
    });
    const { result } = await setup();

    await act(() => {
      result.current.toggleSave();
    });

    expect(result.current.isSaved).toBe(true);
    expect(useFavoritesStore.getState().favorites['recipe-1']).toBeDefined();
  });
});
