import { create } from 'zustand';

import type { RecipeStepDto } from '@/module/recipes/types';
import type { ActiveTimer } from '@/module/guided-cooking/services/guided-cooking-timer-service';

export type GuidedCookingPhase = 'loading' | 'cooking' | 'finished' | 'unavailable';

export interface GuidedCookingState {
  recipeId: string | null;
  slug: string | null;
  steps: RecipeStepDto[];
  currentStepIndex: number;
  startedAt: number | null;
  activeTimer: ActiveTimer | null;
  phase: GuidedCookingPhase;
  startSession: (session: { recipeId: string; slug: string; steps: RecipeStepDto[] }) => void;
  setCurrentStepIndex: (index: number) => void;
  setActiveTimer: (timer: ActiveTimer | null) => void;
  setPhase: (phase: GuidedCookingPhase) => void;
  reset: () => void;
}

const initialSessionState = {
  recipeId: null,
  slug: null,
  steps: [],
  currentStepIndex: 0,
  startedAt: null,
  activeTimer: null,
  phase: 'loading' as GuidedCookingPhase,
};

export const useGuidedCookingStore = create<GuidedCookingState>((set) => ({
  ...initialSessionState,
  startSession: ({ recipeId, slug, steps }) =>
    set({
      recipeId,
      slug,
      steps,
      currentStepIndex: 0,
      startedAt: Date.now(),
      activeTimer: null,
      phase: 'cooking',
    }),
  setCurrentStepIndex: (currentStepIndex) => set({ currentStepIndex }),
  setActiveTimer: (activeTimer) => set({ activeTimer }),
  setPhase: (phase) => set({ phase }),
  reset: () => set(initialSessionState),
}));
