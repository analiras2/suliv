import { beforeEach, describe, expect, it } from '@jest/globals';

import { useGuidedCookingStore } from './use-guided-cooking-store';
import type { RecipeStepDto } from '@/module/recipes/types';

const steps: RecipeStepDto[] = [
  { order: 1, description: 'Misture os ingredientes', stepTimeSeconds: null },
  { order: 2, description: 'Asse por 40 minutos', stepTimeSeconds: 2400 },
];

describe('useGuidedCookingStore', () => {
  beforeEach(() => {
    useGuidedCookingStore.getState().reset();
  });

  it('starts with a non-persisted, unstarted session', () => {
    expect(useGuidedCookingStore.getState()).toEqual(
      expect.objectContaining({
        recipeId: null,
        slug: null,
        steps: [],
        currentStepIndex: 0,
        startedAt: null,
        activeTimer: null,
        phase: 'loading',
      }),
    );
  });

  it('startSession initializes the in-memory session state', () => {
    useGuidedCookingStore.getState().startSession({ recipeId: 'recipe-1', slug: 'bolo', steps });

    const state = useGuidedCookingStore.getState();
    expect(state.recipeId).toBe('recipe-1');
    expect(state.slug).toBe('bolo');
    expect(state.steps).toEqual(steps);
    expect(state.currentStepIndex).toBe(0);
    expect(state.phase).toBe('cooking');
    expect(state.startedAt).toEqual(expect.any(Number));
  });

  it('setCurrentStepIndex, setActiveTimer and setPhase update only their own field', () => {
    useGuidedCookingStore.getState().startSession({ recipeId: 'recipe-1', slug: 'bolo', steps });

    useGuidedCookingStore.getState().setCurrentStepIndex(1);
    expect(useGuidedCookingStore.getState().currentStepIndex).toBe(1);

    const timer = { stepIndex: 1, durationSeconds: 60, endsAt: Date.now() + 60_000, notificationId: 'n1' };
    useGuidedCookingStore.getState().setActiveTimer(timer);
    expect(useGuidedCookingStore.getState().activeTimer).toEqual(timer);

    useGuidedCookingStore.getState().setPhase('finished');
    expect(useGuidedCookingStore.getState().phase).toBe('finished');
  });

  it('reset drops the session back to its initial, non-persisted state (simulated app restart)', () => {
    useGuidedCookingStore.getState().startSession({ recipeId: 'recipe-1', slug: 'bolo', steps });
    useGuidedCookingStore.getState().setCurrentStepIndex(1);

    useGuidedCookingStore.getState().reset();

    expect(useGuidedCookingStore.getState()).toEqual(
      expect.objectContaining({
        recipeId: null,
        slug: null,
        steps: [],
        currentStepIndex: 0,
        startedAt: null,
        activeTimer: null,
        phase: 'loading',
      }),
    );
  });
});
