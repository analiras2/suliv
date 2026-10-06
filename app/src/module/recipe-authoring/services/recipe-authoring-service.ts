import { apiRequest, apiRequestJson } from '@/lib/api-client';
import type { MyRecipeStatus, PaginatedMyRecipes, RecipeAuthoringPayload } from '@/module/recipe-authoring/types';
import type { Category } from '@/module/recipes/types';

export interface RecipeApiResponse {
  id: string;
  slug: string;
  status: MyRecipeStatus;
  coverImageUrl: string | null;
}

export interface DeletePreview {
  favoritesCount: number;
}

// Thin client for the recipe authoring API built in Task 2: POST /recipes,
// PATCH /recipes/:id, POST /recipes/:id/submit, DELETE /recipes/:id?confirm=,
// GET /me/recipes?status=&cursor=, plus the Feed feature's GET /categories,
// reused here so the authoring form can offer real categoryIds.
export interface RecipeAuthoringService {
  create(payload: RecipeAuthoringPayload): Promise<RecipeApiResponse>;
  update(id: string, payload: Partial<RecipeAuthoringPayload>): Promise<RecipeApiResponse>;
  submit(id: string): Promise<RecipeApiResponse>;
  delete(id: string, confirm: boolean): Promise<DeletePreview | void>;
  listMine(status?: MyRecipeStatus, cursor?: string): Promise<PaginatedMyRecipes>;
  listCategories(): Promise<Category[]>;
}

export const recipeAuthoringService: RecipeAuthoringService = {
  create: (payload) => apiRequestJson<RecipeApiResponse>('/recipes', { method: 'POST', body: payload }),

  update: (id, payload) => apiRequestJson<RecipeApiResponse>(`/recipes/${id}`, { method: 'PATCH', body: payload }),

  submit: (id) => apiRequestJson<RecipeApiResponse>(`/recipes/${id}/submit`, { method: 'POST' }),

  async delete(id, confirm) {
    const response = await apiRequest(`/recipes/${id}?confirm=${confirm}`, { method: 'DELETE' });
    if (!confirm) {
      return (await response.json()) as DeletePreview;
    }
  },

  listMine(status, cursor) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (cursor) params.set('cursor', cursor);
    const query = params.toString();
    const queryString = query ? `?${query}` : '';
    return apiRequestJson<PaginatedMyRecipes>(`/me/recipes${queryString}`);
  },

  listCategories: () => apiRequestJson<Category[]>('/categories'),
};
