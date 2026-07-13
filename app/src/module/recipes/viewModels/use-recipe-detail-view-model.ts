import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useRecipeQuery } from '@/module/recipes/queries/use-recipe-query';
import { useSavedRecipesStore } from '@/module/recipes/store/use-saved-recipes-store';

export function useRecipeDetailViewModel(id: string) {
  const router = useRouter();
  const recipeQuery = useRecipeQuery(id);
  const isSaved = useSavedRecipesStore((state) => state.savedIds.has(id));
  const toggleSaved = useSavedRecipesStore((state) => state.toggleSaved);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const toggleSave = useCallback(() => {
    toggleSaved(id);
  }, [toggleSaved, id]);

  return {
    isLoading: recipeQuery.isLoading,
    recipe: recipeQuery.data,
    isSaved,
    toggleSave,
    goBack,
  };
}
