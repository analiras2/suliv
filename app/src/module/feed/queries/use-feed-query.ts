import { useQuery } from '@tanstack/react-query';

import { feedService } from '@/module/feed/services/feed-service';

export const FEED_QUERY_KEY = ['feed'];

export function useFeedQuery() {
  return useQuery({
    queryKey: FEED_QUERY_KEY,
    queryFn: () => feedService.fetchFeed(),
  });
}
