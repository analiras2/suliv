import useSWR from "swr";
import { getFeed } from "../../../services/feedApi";

export function useFeed() {
  const { data, error, isLoading, mutate } = useSWR("mobile-feed", getFeed, {
    revalidateOnFocus: false,
  });

  return {
    feed: data,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: mutate,
  };
}
