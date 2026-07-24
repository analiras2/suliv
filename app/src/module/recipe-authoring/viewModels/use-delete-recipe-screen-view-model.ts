import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

import { useMyRecipesViewModel } from '@/module/recipe-authoring/viewModels/use-my-recipes-view-model';

const MY_RECIPES_ROUTE = '/profile/my-recipes' as Href;

// Thin screen-level wiring over Task 3's use-my-recipes-view-model: runs the
// confirm=false impact preview on mount, then confirm=true on user action.
// No business logic of its own beyond sequencing the two calls and navigating.
export interface DeleteRecipeScreenViewModel {
  isLoadingPreview: boolean;
  favoritesCount: number;
  error: string | null;
  isDeleting: boolean;
  confirm: () => Promise<void>;
  cancel: () => void;
}

export function useDeleteRecipeScreenViewModel(recipeId: string): DeleteRecipeScreenViewModel {
  const router = useRouter();
  const { requestDelete, confirmDelete } = useMyRecipesViewModel();

  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    requestDelete(recipeId)
      .then((preview) => {
        if (!cancelled) setFavoritesCount(preview?.favoritesCount ?? 0);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Não foi possível carregar o impacto da exclusão.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPreview(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- requestDelete is stable per render session, only recipeId should re-trigger the preview
  }, [recipeId]);

  const confirm = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await confirmDelete(recipeId);
      router.replace(MY_RECIPES_ROUTE);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível excluir a receita.');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancel = () => {
    router.back();
  };

  return { isLoadingPreview, favoritesCount, error, isDeleting, confirm, cancel };
}
