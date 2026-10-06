import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ApiError } from '@/lib/api-error';
import { ERROR_MESSAGES } from '@/lib/error-messages';
import type { Recipe, RecipeDetail } from '@/module/recipes/types';

const mockFetchBySlug = jest.fn<(slug: string) => Promise<RecipeDetail>>();
const mockGetCachedDetail = jest.fn<(slug: string) => (RecipeDetail & { cachedAt: string }) | null>();
const mockToggleFavorite = jest.fn<(recipe: RecipeDetail) => void>();
let mockIsConnected = false;

jest.mock('@/lib/network-status', () => ({ useNetworkStatus: () => ({ isConnected: mockIsConnected }) }));
jest.mock('@/module/recipes/services/recipe-detail-cache', () => ({
  getCachedRecipeDetail: (slug: string) => mockGetCachedDetail(slug),
}));
jest.mock('@/module/recipes/services/recipe-detail-service', () => ({
  recipeDetailService: { fetchBySlug: (slug: string) => mockFetchBySlug(slug) },
}));
jest.mock('@/module/recipes/store/use-favorites-store', () => ({
  useFavoritesStore: Object.assign(
    (selector: (state: { favorites: Record<string, unknown> }) => unknown) => selector({ favorites: {} }),
    { getState: () => ({ toggleFavorite: mockToggleFavorite }) },
  ),
}));

// eslint-disable-next-line import/first
import { useFavoriteToggle } from './use-favorite-toggle';

const recipe = { id: 'recipe-1', slug: 'panqueca' } as Recipe;
const detail = { ...recipe, ingredients: [], steps: [] } as unknown as RecipeDetail;

describe('useFavoriteToggle failures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConnected = false;
    mockGetCachedDetail.mockReturnValue(null);
  });

  it('shows the offline copy when the detail is not cached and the request has no connection', async () => {
    mockFetchBySlug.mockRejectedValue(new ApiError('NETWORK_OFFLINE', null));
    const { result } = await renderHook(() => useFavoriteToggle([recipe]));

    await act(async () => result.current.toggleSaved('recipe-1'));

    await waitFor(() => expect(result.current.favoriteError).toBe(ERROR_MESSAGES.NETWORK_OFFLINE));
    expect(mockToggleFavorite).not.toHaveBeenCalled();
  });

  it('keeps toggling silently when the detail is cached, even offline', async () => {
    mockGetCachedDetail.mockReturnValue({ ...detail, cachedAt: '2026-07-23T10:00:00.000Z' });
    const { result } = await renderHook(() => useFavoriteToggle([recipe]));

    await act(async () => result.current.toggleSaved('recipe-1'));

    expect(mockToggleFavorite).toHaveBeenCalledTimes(1);
    expect(mockFetchBySlug).not.toHaveBeenCalled();
    expect(result.current.favoriteError).toBeNull();
  });

  it('clears the offline notice once the connection returns', async () => {
    mockFetchBySlug.mockRejectedValue(new ApiError('NETWORK_OFFLINE', null));
    const { result, rerender } = await renderHook(() => useFavoriteToggle([recipe]));
    await act(async () => result.current.toggleSaved('recipe-1'));
    await waitFor(() => expect(result.current.favoriteError).not.toBeNull());

    mockIsConnected = true;
    await rerender({});

    expect(result.current.favoriteError).toBeNull();
  });

  it('clears the notice and favorites when a later attempt succeeds', async () => {
    mockFetchBySlug.mockRejectedValueOnce(new ApiError('NETWORK_OFFLINE', null));
    const { result } = await renderHook(() => useFavoriteToggle([recipe]));
    await act(async () => result.current.toggleSaved('recipe-1'));
    await waitFor(() => expect(result.current.favoriteError).not.toBeNull());

    mockFetchBySlug.mockResolvedValue(detail);
    await act(async () => result.current.toggleSaved('recipe-1'));

    await waitFor(() => expect(mockToggleFavorite).toHaveBeenCalledWith(detail));
    expect(result.current.favoriteError).toBeNull();
  });

  it('shows the generic copy for an unrecognised failure', async () => {
    mockFetchBySlug.mockRejectedValue(new Error('boom'));
    const { result } = await renderHook(() => useFavoriteToggle([recipe]));

    await act(async () => result.current.toggleSaved('recipe-1'));

    await waitFor(() => expect(result.current.favoriteError).toBe('Algo deu errado. Tente novamente.'));
  });
});
