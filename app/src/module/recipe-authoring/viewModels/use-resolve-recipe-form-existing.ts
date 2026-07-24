import { useRecipeDetailQuery } from '@/module/recipes/queries/use-recipe-detail-query';
import type { RecipeDetail } from '@/module/recipes/types';
import { useMyRecipesViewModel } from '@/module/recipe-authoring/viewModels/use-my-recipes-view-model';
import type { RecipeFormExisting, RecipeFormFields } from '@/module/recipe-authoring/viewModels/use-recipe-form-view-model';
import type { MyRecipeStatus, MyRecipeSummary } from '@/module/recipe-authoring/types';

function findRecipe(
  groups: Record<MyRecipeStatus, MyRecipeSummary[]>,
  recipeId: string,
): MyRecipeSummary | undefined {
  for (const status of Object.keys(groups) as MyRecipeStatus[]) {
    const found = groups[status].find((recipe) => recipe.id === recipeId);
    if (found) return found;
  }
  return undefined;
}

// Maps the read-only recipe-detail contract (`GET /recipes/:slug`) into the
// authoring form's field shape, since GET /me/recipes only returns
// summaries — this fetch/mapping is screen-level data assembly, not a
// duplication of Task 3's authoring business logic (validation, sync, submit).
function toFormFields(detail: RecipeDetail): RecipeFormFields {
  return {
    title: detail.title,
    description: detail.description,
    categoryId: detail.category.id,
    prepTimeMinutes: null,
    servings: detail.servings,
    difficulty: detail.difficulty,
    dietPreference: detail.dietPreference,
    ingredients: detail.ingredients.map((ingredient, index) => ({ ...ingredient, order: index })),
    steps: detail.steps,
    authorMessageToModerator: null,
  };
}

export interface ResolveRecipeFormExistingResult {
  isReady: boolean;
  existing: RecipeFormExisting | undefined;
}

// Resolves the `existing` prop useRecipeFormViewModel needs, once and only
// once it's fully available — RecipeFormBody must not mount (and therefore
// must not lazily create its draft id) until this settles, otherwise it
// would spuriously create a brand-new draft while this is still loading.
export function useResolveRecipeFormExisting(recipeId?: string): ResolveRecipeFormExistingResult {
  const myRecipes = useMyRecipesViewModel();
  const found = recipeId ? findRecipe(myRecipes.groups, recipeId) : undefined;
  const isApprovedEdit = found?.status === 'aprovada';
  const detailQuery = useRecipeDetailQuery(found?.slug ?? '', isApprovedEdit);

  if (!recipeId) {
    return { isReady: true, existing: undefined };
  }

  if (myRecipes.isLoading || !found || (isApprovedEdit && !detailQuery.data)) {
    return { isReady: false, existing: undefined };
  }

  const existing: RecipeFormExisting = isApprovedEdit
    ? {
        id: recipeId,
        status: 'aprovada',
        fields: toFormFields(detailQuery.data as RecipeDetail),
        coverImageUrl: (detailQuery.data as RecipeDetail).coverImageUrl,
      }
    : { id: recipeId, status: found.status };

  return { isReady: true, existing };
}
