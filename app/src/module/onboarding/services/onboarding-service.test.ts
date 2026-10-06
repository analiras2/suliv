import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  apiErrorResponse,
  installFetchMock,
  jsonResponse,
  lastRequest,
  resetFakeAuth,
} from '@/test-utils/api-test-helpers';

jest.mock('@/module/auth/services/auth-service', () => ({
  authService: require('@/test-utils/api-test-helpers').fakeAuthService,
}));

// eslint-disable-next-line import/first
import { onboardingService, type OnboardingSubmitPayload } from './onboarding-service';

const payload: OnboardingSubmitPayload = {
  dietPreference: 'vegano',
  allergenIds: ['id-1'],
  newTerms: ['quinoa em pó'],
  cookingLevel: 'iniciante',
  cookingFrequency: 'raramente',
};

const userDto = {
  id: 'user-1',
  email: 'ana@example.com',
  name: 'Ana',
  username: 'ana',
  usernameUpdatedAt: null,
  avatarUrl: null,
  dietPreference: 'vegano',
  cookingLevel: 'iniciante',
  cookingFrequency: 'raramente',
  onboardingCompletedAt: '2026-01-01T00:00:00.000Z',
  termsVersionAccepted: null,
  termsAcceptedAt: null,
  status: 'active',
  createdAt: '2025-12-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('onboardingService', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    resetFakeAuth();
    fetchMock = installFetchMock();
  });

  describe('fetchApprovedAllergens', () => {
    it('UT-015: returns the parsed array of {id, name} from GET /allergens?status=approved', async () => {
      const allergens = [
        { id: 'id-1', name: 'Leite' },
        { id: 'id-2', name: 'Ovos' },
      ];
      fetchMock.mockResolvedValue(jsonResponse(allergens));

      const result = await onboardingService.fetchApprovedAllergens();

      expect(result).toEqual(allergens);
      const request = lastRequest(fetchMock);
      expect(request.url).toContain('/allergens?status=approved');
      expect(request.init.method).toBe('GET');
    });

    it('UT-016: propagates the coded rejection when the request fails, without swallowing it', async () => {
      fetchMock.mockResolvedValue(apiErrorResponse(500, 'INTERNAL_ERROR'));

      await expect(onboardingService.fetchApprovedAllergens()).rejects.toMatchObject({
        code: 'INTERNAL_ERROR',
        status: 500,
      });
    });
  });

  describe('submitOnboarding', () => {
    it('maps the camelCase payload to the snake_case wire format and returns a ProfileSnapshot', async () => {
      fetchMock.mockResolvedValue(jsonResponse(userDto));

      const result = await onboardingService.submitOnboarding(payload);

      expect(result).toEqual({
        id: userDto.id,
        name: userDto.name,
        username: userDto.username,
        avatarUrl: userDto.avatarUrl,
        onboardingCompletedAt: userDto.onboardingCompletedAt,
        cachedAt: expect.any(String),
      });
      const request = lastRequest(fetchMock);
      expect(request.init.method).toBe('POST');
      expect(JSON.parse(request.body as string)).toEqual({
        diet_preference: 'vegano',
        allergen_ids: ['id-1'],
        new_terms: ['quinoa em pó'],
        cooking_level: 'iniciante',
        cooking_frequency: 'raramente',
      });
    });

    it('propagates the coded rejection when the request fails', async () => {
      fetchMock.mockResolvedValue(apiErrorResponse(400, 'VALIDATION_FAILED'));

      await expect(onboardingService.submitOnboarding(payload)).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    });

    it('never calls PATCH /me/allergies (ADR-002)', async () => {
      fetchMock.mockResolvedValue(jsonResponse(userDto));

      await onboardingService.submitOnboarding(payload);

      const calledPaths = fetchMock.mock.calls.map(([path]) => path as string);
      expect(calledPaths.some((path) => path.includes('/me/allergies'))).toBe(false);
    });
  });
});
