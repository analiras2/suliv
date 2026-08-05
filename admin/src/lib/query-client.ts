import { QueryClient, type DefaultOptions } from '@tanstack/react-query';
import { QUEUE_REFETCH_INTERVAL_MS } from './constants';

// Shared by every queue-style query (recipes, reports, allergens, boosts,
// feature flags) per ADR-003: polling + refetch-on-focus instead of push.
export const queueQueryDefaultOptions: DefaultOptions = {
  queries: {
    refetchInterval: QUEUE_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  },
};

export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: queueQueryDefaultOptions });
}
