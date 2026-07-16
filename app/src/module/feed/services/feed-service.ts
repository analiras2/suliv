import { authService, type AuthService } from '@/module/auth/services/auth-service';
import type { FeedResponse, RecipeSummary } from '@/module/feed/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface FeedService {
  fetchFeed(): Promise<FeedResponse>;
}

export class FeedServiceError extends Error {
  constructor(readonly status: number) {
    super(`Feed request failed with status ${status}.`);
  }
}

export function createFeedService(authentication: AuthService = authService): FeedService {
  return {
    async fetchFeed() {
      const session = await authentication.getSession();
      if (!session) {
        throw new FeedServiceError(401);
      }

      const response = await fetch(`${API_BASE_URL}/feed`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        throw new FeedServiceError(response.status);
      }

      return response.json() as Promise<FeedResponse>;
    },
  };
}

export const feedService: FeedService = createFeedService();

export function flattenFeedRecipes(feed: FeedResponse): RecipeSummary[] {
  const all = [...feed.selectedForYou, ...feed.categories.flatMap((section) => section.recipes), ...feed.topOfWeek];
  const seen = new Set<string>();
  return all.filter((recipe) => {
    if (seen.has(recipe.id)) {
      return false;
    }
    seen.add(recipe.id);
    return true;
  });
}
