import { useQuery } from '@tanstack/react-query';

import { fetchRecipeById } from '@/module/recipes/services/recipes-service';

export function useRecipeQuery(id: string) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => fetchRecipeById(id),
  });
}
