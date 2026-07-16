import type { CookingFrequency, CookingLevel, DietPreference } from '@/module/onboarding/services/onboarding-service';

export type OnboardingStep = 0 | 1 | 2;
export type SubmitStatus = 'idle' | 'submitting' | 'error';
export type OnboardingStepName = 'estilo' | 'alergias' | 'nivel_frequencia';

export interface OnboardingState {
  step: OnboardingStep;
  dietPreference: DietPreference | null;
  allergenIds: string[];
  newTerms: string[];
  cookingLevel: CookingLevel | null;
  cookingFrequency: CookingFrequency | null;
  submitStatus: SubmitStatus;
}

export interface OnboardingViewModel extends OnboardingState {
  isStepValid: boolean;
  next: () => void;
  back: () => void;
  setDietPreference: (value: OnboardingState['dietPreference']) => void;
  toggleAllergen: (id: string) => void;
  addNewTerm: (term: string) => void;
  clearAllergies: () => void;
  setCookingLevel: (value: OnboardingState['cookingLevel']) => void;
  setCookingFrequency: (value: OnboardingState['cookingFrequency']) => void;
  submit: () => Promise<void>;
}

export const STEP_NAMES: Record<OnboardingStep, OnboardingStepName> = {
  0: 'estilo',
  1: 'alergias',
  2: 'nivel_frequencia',
};

export const LAST_STEP: OnboardingStep = 2;

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  step: 0,
  dietPreference: null,
  allergenIds: [],
  newTerms: [],
  cookingLevel: null,
  cookingFrequency: null,
  submitStatus: 'idle',
};

export function isStepValidFor(state: OnboardingState): boolean {
  switch (state.step) {
    case 0:
      return state.dietPreference !== null;
    case 1:
      return true;
    case 2:
      return state.cookingLevel !== null && state.cookingFrequency !== null;
  }
}
