import type { Session } from '@supabase/supabase-js';

import { authService, type AuthService } from '@/module/auth/services/auth-service';
import type { UserProfile } from '@/module/auth/types';
import type { CookingFrequency, CookingLevel, DietPreference } from '@/module/onboarding/services/onboarding-service';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface UpdateProfilePayload {
  dietPreference?: DietPreference;
  cookingLevel?: CookingLevel;
  cookingFrequency?: CookingFrequency;
}

export interface ProfileService {
  updateProfile(payload: UpdateProfilePayload): Promise<UserProfile>;
  updateAllergies(allergenIds: string[], newTerm?: string): Promise<UserProfile>;
}

export class ProfileServiceError extends Error {
  constructor(readonly status: number) {
    super(`Profile request failed with status ${status}.`);
  }
}

async function requireSession(authentication: AuthService): Promise<Session> {
  const session = await authentication.getSession();
  if (!session) {
    throw new ProfileServiceError(401);
  }
  return session;
}

async function request(session: Session, path: string, body: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ProfileServiceError(response.status);
  }

  return response.json() as Promise<UserProfile>;
}

function toUpdateProfileBody(payload: UpdateProfilePayload): Record<string, string> {
  const body: Record<string, string> = {};
  if (payload.dietPreference) body.diet_preference = payload.dietPreference;
  if (payload.cookingLevel) body.cooking_level = payload.cookingLevel;
  if (payload.cookingFrequency) body.cooking_frequency = payload.cookingFrequency;
  return body;
}

export function createProfileService(authentication: AuthService = authService): ProfileService {
  return {
    async updateProfile(payload) {
      const session = await requireSession(authentication);
      return request(session, '/me', toUpdateProfileBody(payload));
    },
    async updateAllergies(allergenIds, newTerm) {
      const session = await requireSession(authentication);
      return request(session, '/me/allergies', {
        allergen_ids: allergenIds,
        ...(newTerm ? { new_term: newTerm } : {}),
      });
    },
  };
}

export const profileService: ProfileService = createProfileService();
