import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ERROR_MESSAGES, getErrorMessage } from '@/lib/error-messages';
import { fakeAuthService, installFetchMock, resetFakeAuth } from '@/test-utils/api-test-helpers';

// Only I/O is faked: the auth session, NetInfo, MMKV and `fetch`. The real favorites service,
// API client, resolver and store run together.
jest.mock('@/module/auth/services/auth-service', () => ({
  authService: Object.assign(require('@/test-utils/api-test-helpers').fakeAuthService, {
    onAuthStateChange: () => () => undefined,
  }),
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: () => () => undefined, fetch: async () => ({ isConnected: false }) },
}));
jest.mock('@/lib/offline-cache', () => ({
  offlineCache: { get: () => null, set: () => undefined, remove: () => undefined },
}));
jest.mock('@/module/recipes/services/recipe-detail-cache', () => ({
  cacheRecipeDetail: () => undefined,
  evictCachedRecipeDetail: () => undefined,
  getCachedRecipeDetail: () => null,
}));
jest.mock('@/module/recipes/services/favorites-sync-service', () => ({
  favoritesSyncService: { enqueueAdd: () => undefined, enqueueRemove: () => undefined, flush: async () => undefined },
}));

/* eslint-disable import/first */
import { favoritesService } from '@/module/recipes/services/favorites-service';
import { reconcileWithServer, useFavoritesStore } from '@/module/recipes/store/use-favorites-store';
/* eslint-enable import/first */

const cachedFavorite = {
  recipeId: 'recipe-1',
  slug: 'bolo-de-cenoura',
  favoritedAt: '2026-07-23T10:00:00.000Z',
};

describe('favorites while offline (IT-019)', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    resetFakeAuth();
    fetchMock = installFetchMock();
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    useFavoritesStore.setState({ favorites: { [cachedFavorite.recipeId]: cachedFavorite }, hasReconciled: true });
  });

  it('explains an offline failure in Portuguese instead of the raw network error', async () => {
    const failure = await favoritesService.list().catch((caught: unknown) => caught);

    expect(getErrorMessage(failure)).toBe(ERROR_MESSAGES.NETWORK_OFFLINE);
  });

  it('keeps the locally cached favorites when reconciliation fails offline', async () => {
    await reconcileWithServer();

    expect(fakeAuthService.getSession).toHaveBeenCalled();
    expect(useFavoritesStore.getState().favorites).toEqual({ [cachedFavorite.recipeId]: cachedFavorite });
  });
});
