import { offlineCache } from '@/lib/offline-cache';
import type { RecipeDetail } from '@/module/recipes/types';

interface CachedRecipeDetailEntry {
  detail: RecipeDetail;
  cachedAt: string;
}

function cacheKey(slug: string): string {
  return `cache:recipe-detail:${slug}`;
}

export function cacheRecipeDetail(slug: string, detail: RecipeDetail): void {
  const entry: CachedRecipeDetailEntry = { detail, cachedAt: new Date().toISOString() };
  offlineCache.set(cacheKey(slug), entry);
}

export function getCachedRecipeDetail(
  slug: string
): (RecipeDetail & { cachedAt: string }) | null {
  const entry = offlineCache.get<CachedRecipeDetailEntry>(cacheKey(slug));
  if (!entry) return null;
  return { ...entry.detail, cachedAt: entry.cachedAt };
}

export function evictCachedRecipeDetail(slug: string): void {
  offlineCache.remove(cacheKey(slug));
}
