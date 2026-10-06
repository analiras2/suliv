import { apiRequestJson } from '@/lib/api-client';
import type { UserProfile } from '@/module/auth/types';
import type { ProfileSnapshot } from '@/module/splash/services/critical-data-service';

export type DietPreference = 'vegano' | 'vegetariano' | 'flexitariano';
export type CookingLevel = 'iniciante' | 'intermediario' | 'avancado';
export type CookingFrequency = 'raramente' | 'algumas_vezes_semana' | 'quase_todo_dia';

export interface ApprovedAllergen {
  id: string;
  name: string;
}

export interface OnboardingSubmitPayload {
  dietPreference: DietPreference;
  allergenIds: string[];
  newTerms: string[];
  cookingLevel: CookingLevel;
  cookingFrequency: CookingFrequency;
}

export interface OnboardingService {
  fetchApprovedAllergens(): Promise<ApprovedAllergen[]>;
  submitOnboarding(payload: OnboardingSubmitPayload): Promise<ProfileSnapshot>;
}

function toProfileSnapshot(user: UserProfile): ProfileSnapshot {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    onboardingCompletedAt: user.onboardingCompletedAt,
    cachedAt: new Date().toISOString(),
  };
}

function toOnboardingRequestBody(payload: OnboardingSubmitPayload) {
  return {
    diet_preference: payload.dietPreference,
    allergen_ids: payload.allergenIds,
    new_terms: payload.newTerms,
    cooking_level: payload.cookingLevel,
    cooking_frequency: payload.cookingFrequency,
  };
}

export const onboardingService: OnboardingService = {
  fetchApprovedAllergens: () => apiRequestJson<ApprovedAllergen[]>('/allergens?status=approved'),
  async submitOnboarding(payload) {
    const user = await apiRequestJson<UserProfile>('/me/onboarding', {
      method: 'POST',
      body: toOnboardingRequestBody(payload),
    });
    return toProfileSnapshot(user);
  },
};
