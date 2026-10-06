import { apiRequestJson } from '@/lib/api-client';
import type { RecipeDetail } from '@/module/recipes/types';

export interface RecipeDetailService {
  fetchBySlug(slug: string): Promise<RecipeDetail>;
}

/** Public recipes are readable without a session; a session only adds the author's own unapproved ones. */
export const recipeDetailService: RecipeDetailService = {
  fetchBySlug: (slug) => apiRequestJson<RecipeDetail>(`/recipes/${slug}`, { auth: 'optional' }),
};
