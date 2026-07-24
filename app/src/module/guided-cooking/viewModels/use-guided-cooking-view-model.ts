import { useCallback, useEffect, useRef, useState } from 'react';
import { Share } from 'react-native';

import { useNetworkStatus } from '@/lib/network-status';
import { useGuidedCookingStore } from '@/module/guided-cooking/store/use-guided-cooking-store';
import { useGuidedCookingActions } from '@/module/guided-cooking/viewModels/use-guided-cooking-actions';
import {
  useAbandonOnUnmount,
  useTimerElapseWatch,
} from '@/module/guided-cooking/viewModels/use-guided-cooking-lifecycle-effects';
import {
  defaultGuidedCookingViewModelDeps,
  type GuidedCookingViewModel,
  type GuidedCookingViewModelDeps,
} from '@/module/guided-cooking/viewModels/use-guided-cooking-view-model.types';
import { getCachedRecipeDetail } from '@/module/recipes/services/recipe-detail-cache';
import { useFavoritesStore } from '@/module/recipes/store/use-favorites-store';

const SHARE_BASE_URL = 'https://suliv.app/r';

export type { GuidedCookingViewModel, GuidedCookingViewModelDeps };

export function useGuidedCookingViewModel(
  slug: string,
  deps: Partial<GuidedCookingViewModelDeps> = {},
): GuidedCookingViewModel {
  const resolvedDeps = { ...defaultGuidedCookingViewModelDeps, ...deps };
  const { contentService, analyticsService, timerService, commentsService } = resolvedDeps;

  const phase = useGuidedCookingStore((state) => state.phase);
  const steps = useGuidedCookingStore((state) => state.steps);
  const currentStepIndex = useGuidedCookingStore((state) => state.currentStepIndex);
  const activeTimer = useGuidedCookingStore((state) => state.activeTimer);
  const recipeId = useGuidedCookingStore((state) => state.recipeId);
  const favorites = useFavoritesStore((state) => state.favorites);
  const isFavorited = Boolean(recipeId && favorites[recipeId]);

  const [confirmingAdvance, setConfirmingAdvance] = useState(false);

  const { isConnected } = useNetworkStatus();
  const isConnectedRef = useRef(isConnected);
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    useGuidedCookingStore.getState().reset();
    void contentService.load(slug, isConnectedRef.current).then((result) => {
      if (result.kind === 'unavailable') {
        useGuidedCookingStore.getState().setPhase('unavailable');
        return;
      }
      useGuidedCookingStore
        .getState()
        .startSession({ recipeId: result.detail.id, slug, steps: result.detail.steps });
      analyticsService.track({ type: 'guided_cook_started', recipeId: result.detail.id }, isConnectedRef.current);
    });
  }, [slug, contentService, analyticsService]);

  const { startTimer, requestAdvance, confirmAdvance, cancelAdvanceRequest } = useGuidedCookingActions(
    resolvedDeps,
    isConnectedRef,
    setConfirmingAdvance,
  );

  useTimerElapseWatch(activeTimer, timerService, analyticsService, isConnectedRef);
  useAbandonOnUnmount(analyticsService, isConnectedRef);

  const rate = useCallback(
    (stars: number) => {
      const recipeId = useGuidedCookingStore.getState().recipeId;
      if (!recipeId) return;
      void commentsService.upsert(recipeId, { rating: stars });
    },
    [commentsService],
  );

  const share = useCallback(() => {
    void Share.share({ message: `${SHARE_BASE_URL}/${slug}`, url: `${SHARE_BASE_URL}/${slug}` });
  }, [slug]);

  const toggleFavorite = useCallback(() => {
    const session = useGuidedCookingStore.getState();
    if (!session.recipeId || !session.slug) return;
    const cached = getCachedRecipeDetail(session.slug);
    if (!cached) return;
    const { cachedAt: _cachedAt, ...detail } = cached;
    useFavoritesStore.getState().toggleFavorite(detail);
  }, []);

  return {
    phase,
    steps,
    currentStepIndex,
    activeTimer,
    confirmingAdvance,
    isFavorited,
    startTimer,
    requestAdvance,
    confirmAdvance,
    cancelAdvanceRequest,
    rate,
    share,
    toggleFavorite,
  };
}
