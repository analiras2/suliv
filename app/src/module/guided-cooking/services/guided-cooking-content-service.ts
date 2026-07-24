import { cacheRecipeDetail, getCachedRecipeDetail } from '@/module/recipes/services/recipe-detail-cache';
import { recipeDetailService } from '@/module/recipes/services/recipe-detail-service';
import type { RecipeDetail } from '@/module/recipes/types';

export type GuidedContentResult =
  | { kind: 'online'; detail: RecipeDetail }
  | { kind: 'offline'; detail: RecipeDetail }
  | { kind: 'unavailable' };

export interface GuidedCookingContentService {
  load(slug: string, isConnected: boolean): Promise<GuidedContentResult>;
}

async function load(slug: string, isConnected: boolean): Promise<GuidedContentResult> {
  if (isConnected) {
    const detail = await recipeDetailService.fetchBySlug(slug);
    cacheRecipeDetail(slug, detail);
    return { kind: 'online', detail };
  }

  const cached = getCachedRecipeDetail(slug);
  if (!cached) {
    return { kind: 'unavailable' };
  }

  const { cachedAt: _cachedAt, ...detail } = cached;
  return { kind: 'offline', detail };
}

export const guidedCookingContentService: GuidedCookingContentService = { load };
