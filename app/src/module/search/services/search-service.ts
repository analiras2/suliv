import { authService, type AuthService } from '@/module/auth/services/auth-service';
import type { ListingFilters, ListingOrigin, PaginatedRecipes } from '@/module/search/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface SearchService {
  search(origin: ListingOrigin, filters: ListingFilters, cursor?: string): Promise<PaginatedRecipes>;
}

export class SearchServiceError extends Error {
  constructor(readonly status: number) {
    super(`Search request failed with status ${status}.`);
  }
}

function buildQueryParams(origin: ListingOrigin, filters: ListingFilters, cursor?: string): URLSearchParams {
  const params = new URLSearchParams();
  params.set('origin', origin);
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.time) params.set('time', filters.time);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.diet) params.set('diet', filters.diet);
  for (const allergen of filters.allergens ?? []) {
    params.append('allergens', allergen);
  }
  if (cursor) params.set('cursor', cursor);
  return params;
}

export function createSearchService(authentication: AuthService = authService): SearchService {
  return {
    async search(origin, filters, cursor) {
      const session = await authentication.getSession();
      if (!session) {
        throw new SearchServiceError(401);
      }

      const params = buildQueryParams(origin, filters, cursor);
      const response = await fetch(`${API_BASE_URL}/recipes/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        throw new SearchServiceError(response.status);
      }

      return response.json() as Promise<PaginatedRecipes>;
    },
  };
}

export const searchService: SearchService = createSearchService();
