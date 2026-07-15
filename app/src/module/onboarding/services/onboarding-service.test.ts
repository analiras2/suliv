import type { Session } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { AuthService } from '@/module/auth/services/auth-service';

jest.mock('@/module/auth/services/auth-service', () => ({ authService: {} }));

// eslint-disable-next-line import/first
import {
  createOnboardingService,
  OnboardingServiceError,
  type OnboardingSubmitPayload,
} from './onboarding-service';

const session = { access_token: 'access-token' } as Session;

const payload: OnboardingSubmitPayload = {
  dietPreference: 'vegano',
  allergenIds: ['id-1'],
  newTerms: ['quinoa em pó'],
  cookingLevel: 'iniciante',
  cookingFrequency: 'raramente',
};

describe('onboardingService', () => {
  let authentication: jest.Mocked<AuthService>;
  let fetchMock: jest.Mock<(...args: Parameters<typeof fetch>) => Promise<Partial<Response>>>;

  beforeEach(() => {
    jest.clearAllMocks();
    authentication = {
      getSession: jest.fn<() => Promise<Session | null>>().mockResolvedValue(session),
      onAuthStateChange: jest.fn(() => jest.fn()),
      signInWithMagicLink: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    };
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchApprovedAllergens', () => {
    it('UT-015: returns the parsed array of {id, name} from GET /allergens?status=approved', async () => {
      const allergens = [
        { id: 'id-1', name: 'Leite' },
        { id: 'id-2', name: 'Ovos' },
      ];
      fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => allergens });
      const service = createOnboardingService(authentication);

      const result = await service.fetchApprovedAllergens();

      expect(result).toEqual(allergens);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/allergens?status=approved'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('UT-016: propagates the rejection when the request fails, without swallowing it', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
      const service = createOnboardingService(authentication);

      await expect(service.fetchApprovedAllergens()).rejects.toBeInstanceOf(OnboardingServiceError);
    });
  });

  describe('submitOnboarding', () => {
    it('maps the camelCase payload to the snake_case wire format and returns a ProfileSnapshot', async () => {
      const snapshot = {
        id: 'user-1',
        name: 'Ana',
        username: 'ana',
        avatarUrl: null,
        onboardingCompletedAt: '2026-01-01T00:00:00.000Z',
        cachedAt: '2026-01-01T00:00:00.000Z',
      };
      fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => snapshot });
      const service = createOnboardingService(authentication);

      const result = await service.submitOnboarding(payload);

      expect(result).toEqual(snapshot);
      const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(requestInit.body as string)).toEqual({
        diet_preference: 'vegano',
        allergen_ids: ['id-1'],
        new_terms: ['quinoa em pó'],
        cooking_level: 'iniciante',
        cooking_frequency: 'raramente',
      });
    });

    it('propagates the rejection when the request fails', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({}) });
      const service = createOnboardingService(authentication);

      await expect(service.submitOnboarding(payload)).rejects.toBeInstanceOf(OnboardingServiceError);
    });

    it('never calls PATCH /me/allergies (ADR-002)', async () => {
      fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
      const service = createOnboardingService(authentication);

      await service.submitOnboarding(payload);

      const calledPaths = fetchMock.mock.calls.map(([path]) => path as string);
      expect(calledPaths.some((path) => path.includes('/me/allergies'))).toBe(false);
    });
  });
});
