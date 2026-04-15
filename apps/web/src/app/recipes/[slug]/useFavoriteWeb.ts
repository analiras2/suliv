"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addFavorite, removeFavorite } from "../../../lib/recipesApi";

interface UseFavoriteWebResult {
  isFavorite: boolean;
  toggle: () => void;
  isLoading: boolean;
}

/**
 * Web-specific favorite toggle.
 * - When unauthenticated, redirects to /login?redirect=<currentPath> instead of toggling.
 * - Optimistic update with rollback on error.
 */
export function useFavoriteWeb(
  recipeId: string,
  initialState: boolean,
  isAuthenticated: boolean,
  currentPath: string,
): UseFavoriteWebResult {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const pendingRef = useRef(false);

  const toggle = useCallback(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (pendingRef.current) return;

    const prev = isFavorite;
    const next = !prev;

    // Optimistic update
    setIsFavorite(next);
    pendingRef.current = true;
    setIsLoading(true);

    const action = next ? addFavorite : removeFavorite;

    action(recipeId)
      .catch(() => {
        // Rollback on error
        setIsFavorite(prev);
      })
      .finally(() => {
        pendingRef.current = false;
        setIsLoading(false);
      });
  }, [isAuthenticated, isFavorite, recipeId, router, currentPath]);

  return { isFavorite, toggle, isLoading };
}
