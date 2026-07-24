import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

import { useMyRecipesViewModel, type UseMyRecipesViewModel } from '@/module/recipe-authoring/viewModels/use-my-recipes-view-model';
import type { MyRecipeStatus } from '@/module/recipe-authoring/types';

// Thin screen-level wiring over Task 3's use-my-recipes-view-model: adds
// navigation and the >10-unsent-drafts / >7-days-unsynced warning copy, no
// business logic of its own.
const STATUS_ORDER: MyRecipeStatus[] = ['rascunho', 'precisa_de_ajustes', 'em_analise', 'aprovada'];
const UNSENT_DRAFTS_WARNING = 'Você tem muitos rascunhos sem enviar. Que tal terminar um deles?';
const STALE_DRAFTS_WARNING = 'Um rascunho está há mais de 7 dias sem sincronizar. Abra-o para tentar novamente.';

export interface MyRecipesListScreenViewModel extends UseMyRecipesViewModel {
  statusOrder: MyRecipeStatus[];
  warnings: string[];
  openRecipe: (recipeId: string) => void;
  openDeleteConfirmation: (recipeId: string) => void;
  createRecipe: () => void;
}

export function useMyRecipesListScreenViewModel(): MyRecipesListScreenViewModel {
  const router = useRouter();
  const myRecipes = useMyRecipesViewModel();

  const openRecipe = useCallback(
    (recipeId: string) => {
      router.push(`/profile/my-recipes/${recipeId}` as Href);
    },
    [router],
  );

  const openDeleteConfirmation = useCallback(
    (recipeId: string) => {
      router.push(`/profile/my-recipes/${recipeId}/delete` as Href);
    },
    [router],
  );

  const createRecipe = useCallback(() => {
    router.push('/profile/my-recipes/new' as Href);
  }, [router]);

  const warnings = [
    myRecipes.hasTooManyUnsentDrafts ? UNSENT_DRAFTS_WARNING : null,
    myRecipes.staleDraftIds.length > 0 ? STALE_DRAFTS_WARNING : null,
  ].filter((warning): warning is string => warning !== null);

  return {
    ...myRecipes,
    statusOrder: STATUS_ORDER,
    warnings,
    openRecipe,
    openDeleteConfirmation,
    createRecipe,
  };
}
