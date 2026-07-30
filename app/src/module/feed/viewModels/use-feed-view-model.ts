import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { analyticsClient, type AnalyticsClient } from '@/lib/analytics';
import { useFeedQuery } from '@/module/feed/queries/use-feed-query';
import type { CategorySection, RecipeSummary } from '@/module/feed/types';
import { useFavoriteToggle } from '@/module/recipes/viewModels/use-favorite-toggle';

const VER_TUDO_ROUTE = '/ver-tudo' as Href;

export type VerTudoOrigin = 'categoria' | 'top_semana';

export interface FeedViewModel {
  isLoading: boolean;
  selectedForYou: RecipeSummary[];
  categorySections: CategorySection[];
  topOfWeek: RecipeSummary[];
  savedIds: Set<string>;
  toggleSaved: (id: string) => void;
  openRecipe: (slug: string, origin: string) => void;
  openVerTudo: (origin: VerTudoOrigin, categoryKey?: string) => void;
}

export function useFeedViewModel(analytics: AnalyticsClient = analyticsClient): FeedViewModel {
  const router = useRouter();
  const feedQuery = useFeedQuery();
  const allRecipes = useMemo(
    () => [
      ...(feedQuery.data?.selectedForYou ?? []),
      ...(feedQuery.data?.categories.flatMap((section) => section.recipes) ?? []),
      ...(feedQuery.data?.topOfWeek ?? []),
    ],
    [feedQuery.data],
  );
  const { savedIds, toggleSaved } = useFavoriteToggle(allRecipes);
  const recipesBySlug = useMemo(() => new Map(allRecipes.map((recipe) => [recipe.slug, recipe])), [allRecipes]);

  const openRecipe = useCallback(
    (slugOrId: string, origin: string) => {
      const recipeId = recipesBySlug.get(slugOrId)?.id ?? slugOrId;
      analytics.track('recipe_opened', { recipe_id: recipeId, origin });
      router.push(`/recipe/${slugOrId}`);
    },
    [analytics, router, recipesBySlug],
  );

  const openVerTudo = useCallback(
    (origin: VerTudoOrigin, categoryKey?: string) => {
      router.push({
        pathname: VER_TUDO_ROUTE,
        params: categoryKey ? { origin, categoryKey } : { origin },
      } as Href);
    },
    [router],
  );

  return {
    isLoading: feedQuery.isLoading,
    selectedForYou: feedQuery.data?.selectedForYou ?? [],
    categorySections: feedQuery.data?.categories ?? [],
    topOfWeek: feedQuery.data?.topOfWeek ?? [],
    savedIds,
    toggleSaved,
    openRecipe,
    openVerTudo,
  };
}
