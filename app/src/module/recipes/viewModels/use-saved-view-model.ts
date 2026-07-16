import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { useFeedQuery } from '@/module/feed/queries/use-feed-query';
import { flattenFeedRecipes } from '@/module/feed/services/feed-service';
import { useSavedRecipesStore } from '@/module/recipes/store/use-saved-recipes-store';

export function useSavedViewModel() {
  const router = useRouter();
  const feedQuery = useFeedQuery();
  const savedIds = useSavedRecipesStore((state) => state.savedIds);
  const toggleSaved = useSavedRecipesStore((state) => state.toggleSaved);

  const savedRecipes = useMemo(() => {
    const allRecipes = feedQuery.data ? flattenFeedRecipes(feedQuery.data) : [];
    return allRecipes.filter((recipe) => savedIds.has(recipe.id));
  }, [feedQuery.data, savedIds]);

  const openRecipe = useCallback(
    (id: string) => {
      router.push(`/recipe/${id}`);
    },
    [router],
  );

  const goExplore = useCallback(() => {
    router.push('/');
  }, [router]);

  return {
    isLoading: feedQuery.isLoading,
    savedRecipes,
    toggleSaved,
    openRecipe,
    goExplore,
  };
}
