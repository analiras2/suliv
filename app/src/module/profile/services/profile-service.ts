import { apiRequestJson } from '@/lib/api-client';
import type { UserProfile } from '@/module/auth/types';
import type { CookingFrequency, CookingLevel, DietPreference } from '@/module/onboarding/services/onboarding-service';

export interface UpdateProfilePayload {
  dietPreference?: DietPreference;
  cookingLevel?: CookingLevel;
  cookingFrequency?: CookingFrequency;
}

export interface ProfileService {
  updateProfile(payload: UpdateProfilePayload): Promise<UserProfile>;
  updateAllergies(allergenIds: string[], newTerm?: string): Promise<UserProfile>;
}

function toUpdateProfileBody(payload: UpdateProfilePayload): Record<string, string> {
  const body: Record<string, string> = {};
  if (payload.dietPreference) body.diet_preference = payload.dietPreference;
  if (payload.cookingLevel) body.cooking_level = payload.cookingLevel;
  if (payload.cookingFrequency) body.cooking_frequency = payload.cookingFrequency;
  return body;
}

export const profileService: ProfileService = {
  updateProfile: (payload) =>
    apiRequestJson<UserProfile>('/me', { method: 'PATCH', body: toUpdateProfileBody(payload) }),
  updateAllergies: (allergenIds, newTerm) =>
    apiRequestJson<UserProfile>('/me/allergies', {
      method: 'PATCH',
      body: { allergen_ids: allergenIds, ...(newTerm ? { new_term: newTerm } : {}) },
    }),
};
