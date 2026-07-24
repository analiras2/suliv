import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';

import { useGuidedCookingStore } from '@/module/guided-cooking/store/use-guided-cooking-store';
import type { GuidedCookingViewModelDeps } from '@/module/guided-cooking/viewModels/use-guided-cooking-view-model.types';

export interface GuidedCookingActions {
  startTimer: (stepIndex: number) => void;
  requestAdvance: () => void;
  confirmAdvance: () => void;
  cancelAdvanceRequest: () => void;
}

/** Extracted from the view model to keep both files under the 150-line file-size rule. */
export function useGuidedCookingActions(
  deps: GuidedCookingViewModelDeps,
  isConnectedRef: MutableRefObject<boolean>,
  setConfirmingAdvance: Dispatch<SetStateAction<boolean>>,
): GuidedCookingActions {
  const { timerService, analyticsService } = deps;

  const advanceStep = useCallback(
    (hadTimer: boolean) => {
      const state = useGuidedCookingStore.getState();
      if (!state.recipeId) return;

      analyticsService.track(
        { type: 'guided_step_completed', recipeId: state.recipeId, stepIndex: state.currentStepIndex, hadTimer },
        isConnectedRef.current,
      );

      const isLastStep = state.currentStepIndex >= state.steps.length - 1;
      if (isLastStep) {
        const totalDurationSeconds = Date.now() - (state.startedAt ?? Date.now());
        useGuidedCookingStore.getState().setPhase('finished');
        analyticsService.track(
          { type: 'guided_cook_finished', recipeId: state.recipeId, totalDurationSeconds },
          isConnectedRef.current,
        );
      } else {
        useGuidedCookingStore.getState().setCurrentStepIndex(state.currentStepIndex + 1);
      }
    },
    [analyticsService, isConnectedRef],
  );

  const startTimer = useCallback(
    (stepIndex: number) => {
      const state = useGuidedCookingStore.getState();
      if (state.activeTimer || !state.recipeId) return;

      const step = state.steps[stepIndex];
      if (!step || step.stepTimeSeconds == null) return;

      const durationSeconds = step.stepTimeSeconds;
      void timerService.schedule(stepIndex, durationSeconds).then((timer) => {
        useGuidedCookingStore.getState().setActiveTimer(timer);
        analyticsService.track(
          { type: 'guided_timer_started', recipeId: state.recipeId as string, stepIndex, durationSeconds },
          isConnectedRef.current,
        );
      });
    },
    [timerService, analyticsService, isConnectedRef],
  );

  const requestAdvance = useCallback(() => {
    const state = useGuidedCookingStore.getState();
    if (state.activeTimer) {
      setConfirmingAdvance(true);
      return;
    }
    advanceStep(false);
  }, [advanceStep, setConfirmingAdvance]);

  const confirmAdvance = useCallback(() => {
    const state = useGuidedCookingStore.getState();
    const timer = state.activeTimer;
    if (!timer || !state.recipeId) {
      setConfirmingAdvance(false);
      return;
    }

    void timerService.cancel(timer.notificationId).then(() => {
      useGuidedCookingStore.getState().setActiveTimer(null);
      const timerStartedAt = timer.endsAt - timer.durationSeconds * 1000;
      const elapsedSeconds = Math.max(0, Math.round((Date.now() - timerStartedAt) / 1000));
      analyticsService.track(
        {
          type: 'guided_timer_abandoned',
          recipeId: state.recipeId as string,
          stepIndex: timer.stepIndex,
          elapsedSeconds,
        },
        isConnectedRef.current,
      );
      setConfirmingAdvance(false);
      advanceStep(true);
    });
  }, [timerService, analyticsService, isConnectedRef, setConfirmingAdvance, advanceStep]);

  const cancelAdvanceRequest = useCallback(() => {
    setConfirmingAdvance(false);
  }, [setConfirmingAdvance]);

  return { startTimer, requestAdvance, confirmAdvance, cancelAdvanceRequest };
}
