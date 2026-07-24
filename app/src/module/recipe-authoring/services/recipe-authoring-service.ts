import { authService, type AuthService } from '@/module/auth/services/auth-service';
import type { MyRecipeStatus, PaginatedMyRecipes, RecipeAuthoringPayload } from '@/module/recipe-authoring/types';
import type { Category } from '@/module/recipes/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

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

export class RecipeAuthoringServiceError extends Error {
  constructor(readonly status: number) {
    super(`Recipe authoring request failed with status ${status}.`);
  }
}

async function authorizedFetch(
  authentication: AuthService,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const session = await authentication.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (session) headers.Authorization = `Bearer ${session.access_token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    throw new RecipeAuthoringServiceError(response.status);
  }
  return response;
}

export function createRecipeAuthoringService(
  authentication: AuthService = authService,
): RecipeAuthoringService {
  return {
    async create(payload) {
      const response = await authorizedFetch(authentication, '/recipes', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return response.json() as Promise<RecipeApiResponse>;
    },

    async update(id, payload) {
      const response = await authorizedFetch(authentication, `/recipes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return response.json() as Promise<RecipeApiResponse>;
    },

    async submit(id) {
      const response = await authorizedFetch(authentication, `/recipes/${id}/submit`, {
        method: 'POST',
      });
      return response.json() as Promise<RecipeApiResponse>;
    },

    async delete(id, confirm) {
      const response = await authorizedFetch(authentication, `/recipes/${id}?confirm=${confirm}`, {
        method: 'DELETE',
      });
      if (!confirm) {
        return response.json() as Promise<DeletePreview>;
      }
    },

    async listMine(status, cursor) {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (cursor) params.set('cursor', cursor);
      const query = params.toString();

      const response = await authorizedFetch(authentication, `/me/recipes${query ? `?${query}` : ''}`);
      return response.json() as Promise<PaginatedMyRecipes>;
    },

    async listCategories() {
      const response = await authorizedFetch(authentication, '/categories');
      return response.json() as Promise<Category[]>;
    },
  };
}

export const recipeAuthoringService: RecipeAuthoringService = createRecipeAuthoringService();
