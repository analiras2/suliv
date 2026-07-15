import type { Session } from '@supabase/supabase-js';

import { authService, type AuthService } from '@/module/auth/services/auth-service';
import type { ProfileSnapshot } from '@/module/splash/services/critical-data-service';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

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

export class OnboardingServiceError extends Error {
  constructor(readonly status: number) {
    super(`Onboarding request failed with status ${status}.`);
  }
}

async function requireSession(authentication: AuthService): Promise<Session> {
  const session = await authentication.getSession();
  if (!session) {
    throw new OnboardingServiceError(401);
  }
  return session;
}

async function request(
  session: Session,
  path: string,
  method: 'GET' | 'POST',
  body?: Record<string, unknown>,
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new OnboardingServiceError(response.status);
  }

  return response;
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

export function createOnboardingService(authentication: AuthService = authService): OnboardingService {
  return {
    async fetchApprovedAllergens() {
      const session = await requireSession(authentication);
      const response = await request(session, '/allergens?status=approved', 'GET');
      return response.json() as Promise<ApprovedAllergen[]>;
    },
    async submitOnboarding(payload) {
      const session = await requireSession(authentication);
      const response = await request(session, '/me/onboarding', 'POST', toOnboardingRequestBody(payload));
      return response.json() as Promise<ProfileSnapshot>;
    },
  };
}

export const onboardingService: OnboardingService = createOnboardingService();
