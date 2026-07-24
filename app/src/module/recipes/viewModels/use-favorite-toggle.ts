import { useCallback, useMemo } from 'react';

import { getCachedRecipeDetail } from '@/module/recipes/services/recipe-detail-cache';
import { recipeDetailService } from '@/module/recipes/services/recipe-detail-service';
import { useFavoritesStore } from '@/module/recipes/store/use-favorites-store';
import type { Recipe } from '@/module/recipes/types';

export interface FavoriteToggle {
  savedIds: Set<string>;
  toggleSaved: (id: string) => void;
}

// Card-level bookmark icons (home/search/saved) only carry a Recipe summary,
// not the RecipeDetail the store's toggleFavorite requires for offline
// caching. Reuse the per-slug detail cache when the recipe was already
// viewed (guaranteed for anything currently favorited); otherwise fetch it
// once before toggling. Offline-and-never-viewed is a rare edge case with no
// content to cache, so it's a silent no-op rather than a crash.
export function useFavoriteToggle(recipes: Recipe[]): FavoriteToggle {
  const favorites = useFavoritesStore((state) => state.favorites);
  const savedIds = useMemo(() => new Set(Object.keys(favorites)), [favorites]);

  const toggleSaved = useCallback(
    (id: string) => {
      const recipe = recipes.find((item) => item.id === id);
      if (!recipe) return;

      const cached = getCachedRecipeDetail(recipe.slug);
      if (cached) {
        const { cachedAt: _cachedAt, ...detail } = cached;
        useFavoritesStore.getState().toggleFavorite(detail);
        return;
      }

      recipeDetailService
        .fetchBySlug(recipe.slug)
        .then((detail) => {
          useFavoritesStore.getState().toggleFavorite(detail);
        })
        .catch(() => {
          // Nothing cached and the fetch failed (e.g. offline) — no content to favorite yet.
        });
    },
    [recipes],
  );

  return { savedIds, toggleSaved };
}
