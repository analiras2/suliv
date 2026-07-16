import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { useFeedQuery } from '@/module/feed/queries/use-feed-query';
import { flattenFeedRecipes } from '@/module/feed/services/feed-service';
import { useSavedRecipesStore } from '@/module/recipes/store/use-saved-recipes-store';

export const SEARCH_FILTERS = ['rápido', 'sem glúten', 'jantar', 'café da manhã', 'proteína', 'salgado', 'doce'];

export function useSearchViewModel() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const feedQuery = useFeedQuery();
  const savedIds = useSavedRecipesStore((state) => state.savedIds);
  const toggleSaved = useSavedRecipesStore((state) => state.toggleSaved);

  const allRecipes = useMemo(() => (feedQuery.data ? flattenFeedRecipes(feedQuery.data) : []), [feedQuery.data]);

  const filteredRecipes = useMemo(() => {
    if (!query) return allRecipes;
    const normalizedQuery = query.toLowerCase();
    return allRecipes.filter((recipe) => recipe.title.toLowerCase().includes(normalizedQuery));
  }, [allRecipes, query]);

  const openRecipe = useCallback(
    (id: string) => {
      router.push(`/recipe/${id}`);
    },
    [router],
  );

  return {
    isLoading: feedQuery.isLoading,
    query,
    setQuery,
    recipes: filteredRecipes,
    isEmpty: query.length > 0 && filteredRecipes.length === 0,
    savedIds,
    toggleSaved,
    openRecipe,
  };
}
