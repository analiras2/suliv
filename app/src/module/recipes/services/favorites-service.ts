import { apiRequestJson } from '@/lib/api-client';
import type { RecipeSummary } from '@/module/feed/types';

export interface PaginatedFavorites {
  items: RecipeSummary[];
  nextCursor: string | null;
}

// GET /favorites client — cold-start/reconnect reconciliation only (ADR-001).
// The local store, not this service, is the primary favorites read path.
export interface FavoritesService {
  list(cursor?: string): Promise<PaginatedFavorites>;
}

export const favoritesService: FavoritesService = {
  list(cursor) {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    const query = params.toString();
    const queryString = query ? `?${query}` : '';
    return apiRequestJson<PaginatedFavorites>(`/favorites${queryString}`);
  },
};
