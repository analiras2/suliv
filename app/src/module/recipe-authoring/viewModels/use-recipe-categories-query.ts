import { useQuery } from '@tanstack/react-query';

import { recipeAuthoringService } from '@/module/recipe-authoring/services/recipe-authoring-service';

export function useRecipeCategoriesQuery() {
  return useQuery({
    queryKey: ['recipe-categories'],
    queryFn: () => recipeAuthoringService.listCategories(),
  });
}
