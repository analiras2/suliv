import { useCallback, useRef, useState } from "react";
import useSWR from "swr";
import { useDebounce } from "../../../hooks/useDebounce";
import { getRecipes } from "../../../services/recipesApi";
import type { RecipeCard, RecipeQueryParams } from "../../../services/recipesApi";

interface ActiveFilters {
  maxTime?: 20 | 45 | null;
  difficulty?: string | null;
  category?: string | null;
  mainIngredient?: string | null;
}

interface UseRecipesParams {
  searchQuery: string;
  filters: ActiveFilters;
}

interface UseRecipesResult {
  recipes: RecipeCard[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  error: string | null;
  fetchMore: () => void;
  refresh: () => void;
}

const PAGE_SIZE = 20;

function buildCacheKey(params: RecipeQueryParams): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return `recipes?${sorted}`;
}

export function useRecipes({ searchQuery, filters }: UseRecipesParams): UseRecipesResult {
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [pages, setPages] = useState<RecipeCard[][]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const lastKeyRef = useRef<string>("");

  const queryParams: RecipeQueryParams = {
    ...(debouncedQuery ? { q: debouncedQuery } : {}),
    ...(filters.maxTime != null ? { maxTime: filters.maxTime } : {}),
    ...(filters.difficulty ? { difficulty: filters.difficulty as RecipeQueryParams["difficulty"] } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.mainIngredient ? { mainIngredient: filters.mainIngredient } : {}),
    page: 1,
    limit: PAGE_SIZE,
  };

  const cacheKey = buildCacheKey(queryParams);

  // Reset accumulated pages when search/filters change
  if (cacheKey !== lastKeyRef.current) {
    lastKeyRef.current = cacheKey;
    // Schedule reset on next render cycle
    if (pages.length > 0 || currentPage !== 1) {
      setPages([]);
      setCurrentPage(1);
      setHasMore(true);
    }
  }

  const { data, error, isLoading, mutate } = useSWR(
    cacheKey,
    () => getRecipes(queryParams),
    {
      revalidateOnFocus: false,
      onSuccess: (result) => {
        setPages([result.data]);
        setHasMore(result.hasMore);
        setCurrentPage(1);
      },
    },
  );

  const fetchMore = useCallback(async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getRecipes({ ...queryParams, page: nextPage });
      setPages((prev) => [...prev, result.data]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    } catch {
      // silently fail — user can scroll up and retry
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, hasMore, currentPage, queryParams]);

  const refresh = useCallback(() => {
    setPages([]);
    setCurrentPage(1);
    setHasMore(true);
    mutate();
  }, [mutate]);

  const recipes = pages.length > 0 ? pages.flat() : (data?.data ?? []);

  return {
    recipes,
    isLoading: isLoading && pages.length === 0,
    isFetchingMore,
    hasMore,
    error: error ? String(error.message ?? "Erro ao carregar receitas") : null,
    fetchMore,
    refresh,
  };
}
