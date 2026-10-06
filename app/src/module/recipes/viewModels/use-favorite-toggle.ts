import { useCallback, useMemo, useState } from 'react';

import { ApiError } from '@/lib/api-error';
import { getErrorMessage } from '@/lib/error-messages';
import { useNetworkStatus } from '@/lib/network-status';
import { getCachedRecipeDetail } from '@/module/recipes/services/recipe-detail-cache';
import { recipeDetailService } from '@/module/recipes/services/recipe-detail-service';
import { useFavoritesStore } from '@/module/recipes/store/use-favorites-store';
import type { Recipe } from '@/module/recipes/types';

export interface FavoriteToggle {
  savedIds: Set<string>;
  toggleSaved: (id: string) => void;
  /** Why the last toggle could not run (for example offline with nothing cached), or null. */
  favoriteError: string | null;
}

interface FavoriteFailure {
  message: string;
  isOffline: boolean;
}

// Card-level bookmark icons (home/search/saved) only carry a Recipe summary,
// not the RecipeDetail the store's toggleFavorite requires for offline
// caching. Reuse the per-slug detail cache when the recipe was already
// viewed (guaranteed for anything currently favorited) and favorite it
// locally, silently queueing the sync. Otherwise fetch the detail once before
// toggling: when that fails there is nothing to cache, so the toggle does not
// run and the user is told why instead of seeing the heart do nothing.
export function useFavoriteToggle(recipes: Recipe[]): FavoriteToggle {
  const favorites = useFavoritesStore((state) => state.favorites);
  const savedIds = useMemo(() => new Set(Object.keys(favorites)), [favorites]);
  const { isConnected } = useNetworkStatus();
  const [failure, setFailure] = useState<FavoriteFailure | null>(null);

  const toggleSaved = useCallback(
    (id: string) => {
      const recipe = recipes.find((item) => item.id === id);
      if (!recipe) return;
      setFailure(null);

      const cached = getCachedRecipeDetail(recipe.slug);
      if (cached) {
        // eslint-disable-next-line sonarjs/no-unused-vars -- dropping `cachedAt` via destructure
        const { cachedAt: _cachedAt, ...detail } = cached;
        useFavoritesStore.getState().toggleFavorite(detail);
        return;
      }

      recipeDetailService
        .fetchBySlug(recipe.slug)
        .then((detail) => {
          useFavoritesStore.getState().toggleFavorite(detail);
        })
        .catch((caught: unknown) => {
          setFailure({
            message: getErrorMessage(caught),
            isOffline: caught instanceof ApiError && caught.code === 'NETWORK_OFFLINE',
          });
        });
    },
    [recipes],
  );

  // An offline notice describes a state that ends when the connection returns.
  const favoriteError = failure && !(failure.isOffline && isConnected) ? failure.message : null;

  return { savedIds, toggleSaved, favoriteError };
}
