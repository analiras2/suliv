import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { useRecipesQuery } from '@/module/recipes/queries/use-recipes-query';
import { useSavedRecipesStore } from '@/module/recipes/store/use-saved-recipes-store';

export const SEARCH_FILTERS = ['rápido', 'sem glúten', 'jantar', 'café da manhã', 'proteína', 'salgado', 'doce'];

export function useSearchViewModel() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const recipesQuery = useRecipesQuery();
  const savedIds = useSavedRecipesStore((state) => state.savedIds);
  const toggleSaved = useSavedRecipesStore((state) => state.toggleSaved);

  const filteredRecipes = useMemo(() => {
    const recipes = recipesQuery.data ?? [];
    if (!query) return recipes;
    const normalizedQuery = query.toLowerCase();
    return recipes.filter((recipe) => recipe.title.toLowerCase().includes(normalizedQuery));
  }, [recipesQuery.data, query]);

  const openRecipe = useCallback(
    (id: string) => {
      router.push(`/recipe/${id}`);
    },
    [router],
  );

  return {
    isLoading: recipesQuery.isLoading,
    query,
    setQuery,
    recipes: filteredRecipes,
    isEmpty: query.length > 0 && filteredRecipes.length === 0,
    savedIds,
    toggleSaved,
    openRecipe,
  };
}
