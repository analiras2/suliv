import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { useRecipesQuery } from '@/module/recipes/queries/use-recipes-query';
import { useSavedRecipesStore } from '@/module/recipes/store/use-saved-recipes-store';

export function useSavedViewModel() {
  const router = useRouter();
  const recipesQuery = useRecipesQuery();
  const savedIds = useSavedRecipesStore((state) => state.savedIds);
  const toggleSaved = useSavedRecipesStore((state) => state.toggleSaved);

  const savedRecipes = useMemo(
    () => (recipesQuery.data ?? []).filter((recipe) => savedIds.has(recipe.id)),
    [recipesQuery.data, savedIds],
  );

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
    isLoading: recipesQuery.isLoading,
    savedRecipes,
    toggleSaved,
    openRecipe,
    goExplore,
  };
}
