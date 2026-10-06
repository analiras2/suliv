import { apiRequestJson } from '@/lib/api-client';
import type { FeedResponse, RecipeSummary } from '@/module/feed/types';

export interface FeedService {
  fetchFeed(): Promise<FeedResponse>;
}

export const feedService: FeedService = {
  fetchFeed: () => apiRequestJson<FeedResponse>('/feed'),
};

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
