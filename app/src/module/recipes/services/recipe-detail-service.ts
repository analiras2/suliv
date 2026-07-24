import { authService, type AuthService } from '@/module/auth/services/auth-service';
import type { RecipeDetail } from '@/module/recipes/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface RecipeDetailService {
  fetchBySlug(slug: string): Promise<RecipeDetail>;
}

export class RecipeDetailServiceError extends Error {
  constructor(readonly status: number) {
    super(`Recipe detail request failed with status ${status}.`);
  }
}

export function createRecipeDetailService(authentication: AuthService = authService): RecipeDetailService {
  return {
    async fetchBySlug(slug) {
      const session = await authentication.getSession();
      const headers: Record<string, string> = session ? { Authorization: `Bearer ${session.access_token}` } : {};

      const response = await fetch(`${API_BASE_URL}/recipes/${slug}`, { headers });

      if (!response.ok) {
        throw new RecipeDetailServiceError(response.status);
      }

      return response.json() as Promise<RecipeDetail>;
    },
  };
}

export const recipeDetailService: RecipeDetailService = createRecipeDetailService();
