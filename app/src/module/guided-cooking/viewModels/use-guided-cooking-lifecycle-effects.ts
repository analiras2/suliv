import { useEffect, useRef, type MutableRefObject } from 'react';
import { AppState } from 'react-native';

import type { GuidedCookingAnalyticsService } from '@/module/guided-cooking/services/guided-cooking-analytics-service';
import type { ActiveTimer, GuidedCookingTimerService } from '@/module/guided-cooking/services/guided-cooking-timer-service';
import { useGuidedCookingStore } from '@/module/guided-cooking/store/use-guided-cooking-store';

const ELAPSE_CHECK_INTERVAL_MS = 1000;

/** Detects an ended timer both while foregrounded and on app-foreground-resume; never auto-advances the step. */
export function useTimerElapseWatch(
  activeTimer: ActiveTimer | null,
  timerService: GuidedCookingTimerService,
  analyticsService: GuidedCookingAnalyticsService,
  isConnectedRef: MutableRefObject<boolean>,
): void {
  useEffect(() => {
    if (!activeTimer) return undefined;

    function checkElapsed() {
      const timer = useGuidedCookingStore.getState().activeTimer;
      const recipeId = useGuidedCookingStore.getState().recipeId;
      if (!timer || !recipeId || !timerService.hasElapsed(timer)) return;

      useGuidedCookingStore.getState().setActiveTimer(null);
      analyticsService.track(
        { type: 'guided_timer_completed', recipeId, stepIndex: timer.stepIndex },
        isConnectedRef.current,
      );
    }

    const interval = setInterval(checkElapsed, ELAPSE_CHECK_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') checkElapsed();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [activeTimer, timerService, analyticsService, isConnectedRef]);
}

/** Fires `guided_cook_abandoned` exactly once, only when the screen unmounts mid-session. */
export function useAbandonOnUnmount(
  analyticsService: GuidedCookingAnalyticsService,
  isConnectedRef: MutableRefObject<boolean>,
): void {
  const hasFiredRef = useRef(false);

  useEffect(() => {
    return () => {
      const state = useGuidedCookingStore.getState();
      if (state.phase === 'cooking' && state.recipeId && !hasFiredRef.current) {
        hasFiredRef.current = true;
        analyticsService.track(
          { type: 'guided_cook_abandoned', recipeId: state.recipeId, lastStepIndex: state.currentStepIndex },
          isConnectedRef.current,
        );
      }
    };
  }, [analyticsService, isConnectedRef]);
}
