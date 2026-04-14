interface UseInfiniteScrollOptions {
  threshold?: number;
}

interface UseInfiniteScrollResult {
  onEndReached: () => void;
}

export function useInfiniteScroll(
  fetchMore: () => void,
  options: UseInfiniteScrollOptions & { isLoading: boolean; hasMore: boolean } = {
    isLoading: false,
    hasMore: true,
  },
): UseInfiniteScrollResult {
  const { isLoading, hasMore } = options;

  const onEndReached = () => {
    if (!isLoading && hasMore) {
      fetchMore();
    }
  };

  return { onEndReached };
}
