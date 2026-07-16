import { useEffect, useRef } from 'react';

import { analyticsClient, type AnalyticsClient } from '@/lib/analytics';
import type { FeedViewModel } from '@/module/feed/viewModels/use-feed-view-model';

export function useFeedAnalytics(feed: FeedViewModel, analytics: AnalyticsClient = analyticsClient) {
  const hasViewedFeed = useRef(false);
  const hasViewedSelecionadas = useRef(false);
  const hasViewedCategorias = useRef(false);
  const hasViewedTopSemana = useRef(false);

  useEffect(() => {
    if (hasViewedFeed.current) {
      return;
    }
    hasViewedFeed.current = true;
    analytics.track('feed_viewed', {});
  }, [analytics]);

  useEffect(() => {
    if (feed.isLoading) {
      return;
    }
    if (!hasViewedSelecionadas.current && feed.selectedForYou.length > 0) {
      hasViewedSelecionadas.current = true;
      analytics.track('feed_section_viewed', { section: 'selecionadas' });
    }
    if (!hasViewedCategorias.current && feed.categorySections.length > 0) {
      hasViewedCategorias.current = true;
      analytics.track('feed_section_viewed', {
        section: 'categorias',
        category_key: feed.categorySections[0].category.key,
      });
    }
    if (!hasViewedTopSemana.current && feed.topOfWeek.length > 0) {
      hasViewedTopSemana.current = true;
      analytics.track('feed_section_viewed', { section: 'top_semana' });
    }
  }, [analytics, feed.isLoading, feed.selectedForYou, feed.categorySections, feed.topOfWeek]);
}
