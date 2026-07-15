import { useCallback, useState } from 'react';

import { analyticsClient, type AnalyticsClient } from '@/lib/analytics';
import { offlineCache, type OfflineCache } from '@/lib/offline-cache';
import { onboardingService, type OnboardingService } from '@/module/onboarding/services/onboarding-service';
import {
  INITIAL_ONBOARDING_STATE,
  isStepValidFor,
  LAST_STEP,
  STEP_NAMES,
  type OnboardingState,
  type OnboardingStep,
  type OnboardingViewModel,
} from '@/module/onboarding/types';
import { PROFILE_SNAPSHOT_CACHE_KEY } from '@/module/splash/services/critical-data-service';

export type { OnboardingState, OnboardingStep, OnboardingViewModel } from '@/module/onboarding/types';

export function useOnboardingViewModel(
  service: OnboardingService = onboardingService,
  cache: OfflineCache = offlineCache,
  analytics: AnalyticsClient = analyticsClient,
): OnboardingViewModel {
  const [state, setState] = useState<OnboardingState>(INITIAL_ONBOARDING_STATE);
  const isStepValid = isStepValidFor(state);

  const next = useCallback(() => {
    setState((current) => {
      if (!isStepValidFor(current) || current.step >= LAST_STEP) {
        return current;
      }
      analytics.track('onboarding_step_completed', {
        step: STEP_NAMES[current.step],
        step_index: current.step,
      });
      return { ...current, step: (current.step + 1) as OnboardingStep };
    });
  }, [analytics]);

  const back = useCallback(() => {
    setState((current) =>
      current.step <= 0 ? current : { ...current, step: (current.step - 1) as OnboardingStep },
    );
  }, []);

  const setDietPreference = useCallback(
    (value: OnboardingState['dietPreference']) => {
      setState((current) => ({ ...current, dietPreference: value }));
      if (value) {
        analytics.track('preference_base_selected', { diet_preference: value });
      }
    },
    [analytics],
  );

  const toggleAllergen = useCallback(
    (id: string) => {
      setState((current) => {
        if (current.allergenIds.includes(id)) {
          return { ...current, allergenIds: current.allergenIds.filter((allergenId) => allergenId !== id) };
        }
        analytics.track('allergy_added', { allergen_id: id, is_new_term: false });
        return { ...current, allergenIds: [...current.allergenIds, id] };
      });
    },
    [analytics],
  );

  const addNewTerm = useCallback(
    (term: string) => {
      setState((current) => ({ ...current, newTerms: [...current.newTerms, term] }));
      analytics.track('allergy_added', { allergen_id: null, is_new_term: true });
    },
    [analytics],
  );

  const setCookingLevel = useCallback((value: OnboardingState['cookingLevel']) => {
    setState((current) => ({ ...current, cookingLevel: value }));
  }, []);

  const setCookingFrequency = useCallback((value: OnboardingState['cookingFrequency']) => {
    setState((current) => ({ ...current, cookingFrequency: value }));
  }, []);

  const submit = useCallback(async () => {
    const { dietPreference, allergenIds, newTerms, cookingLevel, cookingFrequency } = state;
    if (!dietPreference || !cookingLevel || !cookingFrequency) {
      return;
    }

    setState((current) => ({ ...current, submitStatus: 'submitting' }));

    try {
      const snapshot = await service.submitOnboarding({
        dietPreference,
        allergenIds,
        newTerms,
        cookingLevel,
        cookingFrequency,
      });
      cache.set(PROFILE_SNAPSHOT_CACHE_KEY, snapshot);
      analytics.track('onboarding_completed', {
        diet_preference: dietPreference,
        cooking_level: cookingLevel,
        cooking_frequency: cookingFrequency,
        allergy_count: allergenIds.length + newTerms.length,
      });
      setState((current) => ({ ...current, submitStatus: 'idle' }));
    } catch {
      setState((current) => ({ ...current, submitStatus: 'error' }));
    }
  }, [state, service, cache, analytics]);

  return {
    ...state,
    isStepValid,
    next,
    back,
    setDietPreference,
    toggleAllergen,
    addNewTerm,
    setCookingLevel,
    setCookingFrequency,
    submit,
  };
}
