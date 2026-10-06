import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  API_TEST_BASE_URL,
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
import { profileService } from './profile-service';

describe('profileService', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    resetFakeAuth();
    fetchMock = installFetchMock();
  });

  describe('updateProfile', () => {
    it('PATCHes /me with only the supplied preference fields', async () => {
      const user = { id: 'user-1' };
      fetchMock.mockResolvedValue(jsonResponse(user));

      const result = await profileService.updateProfile({ dietPreference: 'vegano' });

      expect(result).toBe(user);
      const request = lastRequest(fetchMock);
      expect(request.url).toBe(`${API_TEST_BASE_URL}/me`);
      expect(request.init.method).toBe('PATCH');
      expect(JSON.parse(request.body as string)).toEqual({ diet_preference: 'vegano' });
    });

    it('sends cooking level and frequency fields', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}));

      await profileService.updateProfile({ cookingLevel: 'avancado', cookingFrequency: 'quase_todo_dia' });

      expect(JSON.parse(lastRequest(fetchMock).body as string)).toEqual({
        cooking_level: 'avancado',
        cooking_frequency: 'quase_todo_dia',
      });
    });

    it('propagates the coded rejection when the request fails', async () => {
      fetchMock.mockResolvedValue(apiErrorResponse(422, 'UNPROCESSABLE'));

      await expect(profileService.updateProfile({ dietPreference: 'vegano' })).rejects.toMatchObject({
        code: 'UNPROCESSABLE',
        status: 422,
      });
    });
  });

  describe('updateAllergies', () => {
    it('PATCHes /me/allergies with the given allergen ids and no term', async () => {
      const user = { id: 'user-1' };
      fetchMock.mockResolvedValue(jsonResponse(user));

      const result = await profileService.updateAllergies(['id-leite', 'id-soja']);

      expect(result).toBe(user);
      const request = lastRequest(fetchMock);
      expect(request.url).toBe(`${API_TEST_BASE_URL}/me/allergies`);
      expect(JSON.parse(request.body as string)).toEqual({ allergen_ids: ['id-leite', 'id-soja'] });
    });

    it('includes the free-text term when supplied', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}));

      await profileService.updateAllergies(['id-leite'], 'castanha-do-para');

      expect(JSON.parse(lastRequest(fetchMock).body as string)).toEqual({
        allergen_ids: ['id-leite'],
        new_term: 'castanha-do-para',
      });
    });

    it('propagates the coded rejection when the request fails', async () => {
      fetchMock.mockResolvedValue(apiErrorResponse(400, 'VALIDATION_FAILED'));

      await expect(profileService.updateAllergies(['id-leite'])).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
      });
    });
  });
});
