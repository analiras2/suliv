import { authService, type AuthService } from '@/module/auth/services/auth-service';
import type { RecipeSummary } from '@/module/feed/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface PaginatedFavorites {
  items: RecipeSummary[];
  nextCursor: string | null;
}

// GET /favorites client — cold-start/reconnect reconciliation only (ADR-001).
// The local store, not this service, is the primary favorites read path.
export interface FavoritesService {
  list(cursor?: string): Promise<PaginatedFavorites>;
}

export class FavoritesServiceError extends Error {
  constructor(readonly status: number) {
    super(`Favorites request failed with status ${status}.`);
  }
}

export function createFavoritesService(authentication: AuthService = authService): FavoritesService {
  return {
    async list(cursor) {
      const session = await authentication.getSession();
      if (!session) {
        throw new FavoritesServiceError(401);
      }

      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      const query = params.toString();

      const response = await fetch(`${API_BASE_URL}/favorites${query ? `?${query}` : ''}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        throw new FavoritesServiceError(response.status);
      }

      return response.json() as Promise<PaginatedFavorites>;
    },
  };
}

export const favoritesService: FavoritesService = createFavoritesService();
