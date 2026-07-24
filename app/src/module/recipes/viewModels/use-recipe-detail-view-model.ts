import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { analyticsClient, type AnalyticsClient } from '@/lib/analytics';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import { useRecipeDetailQuery } from '@/module/recipes/queries/use-recipe-detail-query';
import { RecipeDetailServiceError } from '@/module/recipes/services/recipe-detail-service';
import { useFavoritesStore } from '@/module/recipes/store/use-favorites-store';
import type { RecipeDetail } from '@/module/recipes/types';
import { scaleIngredients, type ScaledIngredient } from '@/module/recipes/utils/scale-ingredients';

const LOGIN_ROUTE = '/login' as Href;

export interface RecipeDetailViewModel {
  recipe: RecipeDetail | undefined;
  isLoading: boolean;
  notFound: boolean;
  servings: number;
  setServings: (servings: number) => void;
  scaledIngredients: ScaledIngredient[];
  averageRating: number | null;
  ratingCount: number;
  isSaved: boolean;
  toggleSave: () => void;
  startCooking: () => void;
  goBack: () => void;
  refetch: () => void;
}

export function useRecipeDetailViewModel(
  slug: string,
  analytics: AnalyticsClient = analyticsClient,
): RecipeDetailViewModel {
  const router = useRouter();
  const detailQuery = useRecipeDetailQuery(slug);
  const recipe = detailQuery.data;

  const isAuthenticated = useSessionStore((state) => state.status === 'authenticated');
  const favorites = useFavoritesStore((state) => state.favorites);
  const isSaved = recipe ? Boolean(favorites[recipe.id]) : false;

  const [loadedServings, setLoadedServings] = useState<{ recipeId: string; servings: number } | undefined>(
    undefined,
  );
  if (recipe && loadedServings?.recipeId !== recipe.id) {
    setLoadedServings({ recipeId: recipe.id, servings: recipe.servings });
  }
  const servings = loadedServings?.recipeId === recipe?.id ? loadedServings?.servings : undefined;

  const hasFiredWarningRef = useRef(false);
  useEffect(() => {
    if (recipe?.conflictsWithUser && !hasFiredWarningRef.current) {
      hasFiredWarningRef.current = true;
      analytics.track('recipe_warning_viewed', {
        recipe_id: recipe.id,
        allergen_id: recipe.conflictingAllergens?.[0] ?? '',
      });
    }
  }, [analytics, recipe]);

  const scaledIngredients = useMemo(() => {
    if (!recipe || servings === undefined) {
      return [];
    }
    return scaleIngredients(recipe.ingredients, recipe.servings, servings);
  }, [recipe, servings]);

  const setServings = useCallback(
    (nextServings: number) => {
      if (!recipe || servings === undefined) {
        return;
      }
      analytics.track('serving_adjusted', {
        recipe_id: recipe.id,
        from_servings: servings,
        to_servings: nextServings,
      });
      setLoadedServings({ recipeId: recipe.id, servings: nextServings });
    },
    [analytics, recipe, servings],
  );

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const toggleSave = useCallback(() => {
    if (!isAuthenticated) {
      router.push(LOGIN_ROUTE);
      return;
    }
    if (recipe) {
      useFavoritesStore.getState().toggleFavorite(recipe);
    }
  }, [isAuthenticated, recipe, router]);

  const startCooking = useCallback(() => {
    if (!isAuthenticated) {
      router.push(LOGIN_ROUTE);
      return;
    }
    router.push(`/recipe/${slug}/cook` as Href);
  }, [isAuthenticated, router, slug]);

  const notFound =
    detailQuery.error instanceof RecipeDetailServiceError && detailQuery.error.status === 404;

  return {
    recipe,
    isLoading: detailQuery.isLoading,
    notFound,
    servings: servings ?? 0,
    setServings,
    scaledIngredients,
    averageRating: recipe?.averageRating ?? null,
    ratingCount: recipe?.ratingCount ?? 0,
    isSaved,
    toggleSave,
    startCooking,
    goBack,
    refetch: () => void detailQuery.refetch(),
  };
}
