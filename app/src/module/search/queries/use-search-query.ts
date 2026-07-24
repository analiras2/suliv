import { useInfiniteQuery } from '@tanstack/react-query';

import { searchService } from '@/module/search/services/search-service';
import type { ListingFilters, ListingOrigin } from '@/module/search/types';

export const SEARCH_QUERY_KEY = (origin: ListingOrigin, filters: ListingFilters) => ['search', origin, filters];

export function useSearchQuery(origin: ListingOrigin, filters: ListingFilters) {
  return useInfiniteQuery({
    queryKey: SEARCH_QUERY_KEY(origin, filters),
    queryFn: ({ pageParam }: { pageParam?: string }) => searchService.search(origin, filters, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
