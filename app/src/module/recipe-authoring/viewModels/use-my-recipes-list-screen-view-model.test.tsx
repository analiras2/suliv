import type { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactNode } from 'react';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/lib/offline-cache', () => ({
  offlineCache: { get: () => null, set: jest.fn(), remove: jest.fn() },
}));
jest.mock('@/module/auth/services/auth-service', () => ({
  authService: { getSession: jest.fn(async () => null) },
}));
jest.mock('@/module/recipe-authoring/services/drafts-sync-service', () => ({
  draftsSyncService: { enqueueUpsert: jest.fn(), flush: jest.fn(), onDraftSynced: jest.fn(() => jest.fn()) },
}));
// The screen-level view model always uses the default recipeAuthoringService
// singleton (it has no injection seam), so the module itself must be mocked
// here to avoid a real network call to localhost:3000 hanging the test.
jest.mock('@/module/recipe-authoring/services/recipe-authoring-service', () => ({
  recipeAuthoringService: {
    listMine: jest.fn(async () => ({ items: [], nextCursor: null })),
    delete: jest.fn(),
    listCategories: jest.fn(async () => []),
  },
}));

// eslint-disable-next-line import/first
import { useSessionStore } from '@/module/auth/store/use-session-store';
// eslint-disable-next-line import/first
import { useRecipeDraftsStore } from '@/module/recipe-authoring/store/use-recipe-drafts-store';
// eslint-disable-next-line import/first
import { useMyRecipesListScreenViewModel } from './use-my-recipes-list-screen-view-model';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useMyRecipesListScreenViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRecipeDraftsStore.setState({ drafts: {} });
    useSessionStore.setState({
      session: { access_token: 'token', user: { id: 'user-1' } } as unknown as Session,
      user: null,
      status: 'authenticated',
    });
  });

  it('exposes no warnings when under both soft-warning thresholds', async () => {
    const { result } = await renderHook(() => useMyRecipesListScreenViewModel(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.warnings).toEqual([]);
  });

  it('createRecipe navigates to the new-recipe route', async () => {
    const { result } = await renderHook(() => useMyRecipesListScreenViewModel(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.createRecipe();

    expect(mockPush).toHaveBeenCalledWith('/profile/my-recipes/new');
  });

  it('openRecipe navigates to the recipe edit route by id', async () => {
    const { result } = await renderHook(() => useMyRecipesListScreenViewModel(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.openRecipe('recipe-1');

    expect(mockPush).toHaveBeenCalledWith('/profile/my-recipes/recipe-1');
  });

  it('openDeleteConfirmation navigates to the delete-confirmation route by id', async () => {
    const { result } = await renderHook(() => useMyRecipesListScreenViewModel(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.openDeleteConfirmation('recipe-1');

    expect(mockPush).toHaveBeenCalledWith('/profile/my-recipes/recipe-1/delete');
  });
});
