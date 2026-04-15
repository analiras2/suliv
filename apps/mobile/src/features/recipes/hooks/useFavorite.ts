import { useCallback, useRef, useState } from "react";
import { addFavorite, removeFavorite } from "../../../services/recipesApi";

interface UseFavoriteResult {
  isFavorite: boolean;
  toggle: () => void;
  isLoading: boolean;
}

export function useFavorite(
  recipeId: string,
  initialState: boolean,
  onError?: (err: Error) => void,
): UseFavoriteResult {
  const [isFavorite, setIsFavorite] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  // Prevent concurrent toggles
  const pendingRef = useRef(false);

  const toggle = useCallback(() => {
    if (pendingRef.current) return;

    const prev = isFavorite;
    const next = !prev;

    // Optimistic update — immediate
    setIsFavorite(next);
    pendingRef.current = true;
    setIsLoading(true);

    const action = next ? addFavorite : removeFavorite;

    action(recipeId)
      .catch((err: Error) => {
        // Rollback
        setIsFavorite(prev);
        onError?.(err);
      })
      .finally(() => {
        pendingRef.current = false;
        setIsLoading(false);
      });
  }, [isFavorite, recipeId, onError]);

  return { isFavorite, toggle, isLoading };
}
