import { apiRequestJson } from '@/lib/api-client';
import type { ListingFilters, ListingOrigin, PaginatedRecipes } from '@/module/search/types';

export interface SearchService {
  search(origin: ListingOrigin, filters: ListingFilters, cursor?: string): Promise<PaginatedRecipes>;
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

export const searchService: SearchService = {
  search: (origin, filters, cursor) =>
    apiRequestJson<PaginatedRecipes>(`/recipes/search?${buildQueryParams(origin, filters, cursor).toString()}`),
};
