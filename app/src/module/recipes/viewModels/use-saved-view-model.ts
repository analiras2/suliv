import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useFavoriteToggle } from '@/module/recipes/viewModels/use-favorite-toggle';
import { useFavoritesList } from '@/module/recipes/store/use-favorites-store';

export function useSavedViewModel() {
  const router = useRouter();
  const { items } = useFavoritesList();
  const { toggleSaved } = useFavoriteToggle(items);

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
    isLoading: false,
    savedRecipes: items,
    toggleSaved,
    openRecipe,
    goExplore,
  };
}
