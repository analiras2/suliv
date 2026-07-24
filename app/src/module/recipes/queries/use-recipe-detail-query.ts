import { useQuery } from '@tanstack/react-query';

import { recipeDetailService } from '@/module/recipes/services/recipe-detail-service';

export function useRecipeDetailQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: ['recipe-detail', slug],
    queryFn: () => recipeDetailService.fetchBySlug(slug),
    retry: false,
    enabled: enabled && slug.length > 0,
  });
}
