import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { debounce } from '@/lib/debounce';
import { analyticsClient, type AnalyticsClient } from '@/lib/analytics';
import { useFavoriteToggle } from '@/module/recipes/viewModels/use-favorite-toggle';
import { useSearchQuery } from '@/module/search/queries/use-search-query';
import { CATEGORY_LABELS, type ListingFilters, type ListingOrigin, type RecipeSearchResult } from '@/module/search/types';
import type { RecipeCategoryKey } from '@/module/recipes/types';

const QUERY_DEBOUNCE_MS = 400;

const FILTER_TYPE_MAP: Record<
  Exclude<keyof ListingFilters, 'q'>,
  'categoria' | 'tempo' | 'dificuldade' | 'preferencia' | 'alergia'
> = {
  category: 'categoria',
  time: 'tempo',
  difficulty: 'dificuldade',
  diet: 'preferencia',
  allergens: 'alergia',
};

export interface UseListingViewModelParams {
  origin?: ListingOrigin;
  categoryKey?: RecipeCategoryKey;
}

export interface ListingViewModel {
  title: string;
  query: string;
  setQuery: (q: string) => void;
  filters: ListingFilters;
  setFilter: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K] | undefined) => void;
  results: RecipeSearchResult[];
  isLoading: boolean;
  isEmpty: boolean;
  hasMore: boolean;
  loadMore: () => void;
  openRecipe: (id: string) => void;
  savedIds: Set<string>;
  toggleSaved: (id: string) => void;
}

function deriveTitle(origin: ListingOrigin, categoryKey?: RecipeCategoryKey): string {
  switch (origin) {
    case 'categoria':
      return categoryKey ? CATEGORY_LABELS[categoryKey] : 'Categoria';
    case 'top_semana':
      return 'Top da semana';
    case 'selecionadas':
      return 'Selecionadas para você';
    case 'busca':
    default:
      return 'Busca';
  }
}

function dedupeById(items: RecipeSearchResult[]): RecipeSearchResult[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function useListingViewModel(
  params: UseListingViewModelParams = {},
  analytics: AnalyticsClient = analyticsClient,
): ListingViewModel {
  const router = useRouter();
  const origin = params.origin ?? 'busca';

  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFiltersState] = useState<ListingFilters>({});

  const debouncedSetQuery = useMemo(() => debounce(setDebouncedQuery, QUERY_DEBOUNCE_MS), []);

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value);
      debouncedSetQuery(value);
    },
    [debouncedSetQuery],
  );

  const requestFilters = useMemo<ListingFilters>(
    () => ({ ...filters, q: debouncedQuery || undefined }),
    [filters, debouncedQuery],
  );

  const previousDebouncedQuery = useRef(debouncedQuery);
  useEffect(() => {
    if (previousDebouncedQuery.current === debouncedQuery) return;
    previousDebouncedQuery.current = debouncedQuery;
    analytics.track('search_used', {
      query_length: debouncedQuery.length,
      has_filters: Object.keys(filters).length > 0,
    });
  }, [debouncedQuery, filters, analytics]);

  const searchQuery = useSearchQuery(origin, requestFilters);

  const setFilter = useCallback(
    <K extends keyof ListingFilters>(key: K, value: ListingFilters[K] | undefined) => {
      setFiltersState((current) => ({ ...current, [key]: value }));
      if (key !== 'q' && value !== undefined) {
        analytics.track('filter_applied', {
          filter_type: FILTER_TYPE_MAP[key as Exclude<keyof ListingFilters, 'q'>],
          filter_value: Array.isArray(value) ? value.join(',') : String(value),
        });
      }
    },
    [analytics],
  );

  const results = useMemo(
    () => dedupeById(searchQuery.data?.pages.flatMap((page) => page.items) ?? []),
    [searchQuery.data],
  );

  const loadMore = useCallback(() => {
    if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
      searchQuery.fetchNextPage();
    }
  }, [searchQuery]);

  const openRecipe = useCallback(
    (id: string) => {
      analytics.track('recipe_opened', { recipe_id: id, origin: origin === 'busca' ? 'busca' : 'ver_tudo' });
      router.push(`/recipe/${id}`);
    },
    [analytics, origin, router],
  );

  const title = useMemo(() => deriveTitle(origin, params.categoryKey), [origin, params.categoryKey]);

  const { savedIds, toggleSaved } = useFavoriteToggle(results);

  return {
    title,
    query,
    setQuery,
    filters,
    setFilter,
    results,
    isLoading: searchQuery.isLoading,
    isEmpty: !searchQuery.isLoading && results.length === 0,
    hasMore: searchQuery.hasNextPage ?? false,
    loadMore,
    openRecipe,
    savedIds,
    toggleSaved,
  };
}
