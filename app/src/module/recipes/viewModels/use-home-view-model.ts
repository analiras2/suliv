import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useCategoriesQuery, useRecipesQuery } from '@/module/recipes/queries/use-recipes-query';
import { useSavedRecipesStore } from '@/module/recipes/store/use-saved-recipes-store';

const HOME_RECIPE_COUNT = 4;

export function useHomeViewModel() {
  const router = useRouter();
  const recipesQuery = useRecipesQuery();
  const categoriesQuery = useCategoriesQuery();
  const savedIds = useSavedRecipesStore((state) => state.savedIds);
  const toggleSaved = useSavedRecipesStore((state) => state.toggleSaved);

  const openRecipe = useCallback(
    (id: string) => {
      router.push(`/recipe/${id}`);
    },
    [router],
  );

  return {
    isLoading: recipesQuery.isLoading || categoriesQuery.isLoading,
    recipes: recipesQuery.data?.slice(0, HOME_RECIPE_COUNT) ?? [],
    categories: categoriesQuery.data ?? [],
    savedIds,
    toggleSaved,
    openRecipe,
  };
}
