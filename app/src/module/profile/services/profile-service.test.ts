import type { Session } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { AuthService } from '@/module/auth/services/auth-service';

jest.mock('@/module/auth/services/auth-service', () => ({ authService: {} }));

// eslint-disable-next-line import/first
import { createProfileService, ProfileServiceError } from './profile-service';

const session = { access_token: 'access-token' } as Session;

describe('profileService', () => {
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

  describe('updateProfile', () => {
    it('PATCHes /me with only the supplied preference fields', async () => {
      const user = { id: 'user-1' };
      fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => user });
      const service = createProfileService(authentication);

      const result = await service.updateProfile({ dietPreference: 'vegano' });

      expect(result).toBe(user);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:3000/me');
      expect(init.method).toBe('PATCH');
      expect(JSON.parse(init.body as string)).toEqual({ diet_preference: 'vegano' });
    });

    it('sends cooking level and frequency fields', async () => {
      fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
      const service = createProfileService(authentication);

      await service.updateProfile({ cookingLevel: 'avancado', cookingFrequency: 'quase_todo_dia' });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(init.body as string)).toEqual({
        cooking_level: 'avancado',
        cooking_frequency: 'quase_todo_dia',
      });
    });

    it('propagates the rejection when the request fails', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 422, json: async () => ({}) });
      const service = createProfileService(authentication);

      await expect(service.updateProfile({ dietPreference: 'vegano' })).rejects.toBeInstanceOf(ProfileServiceError);
    });
  });

  describe('updateAllergies', () => {
    it('PATCHes /me/allergies with the given allergen ids and no term', async () => {
      const user = { id: 'user-1' };
      fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => user });
      const service = createProfileService(authentication);

      const result = await service.updateAllergies(['id-leite', 'id-soja']);

      expect(result).toBe(user);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:3000/me/allergies');
      expect(JSON.parse(init.body as string)).toEqual({ allergen_ids: ['id-leite', 'id-soja'] });
    });

    it('includes the free-text term when supplied', async () => {
      fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
      const service = createProfileService(authentication);

      await service.updateAllergies(['id-leite'], 'castanha-do-para');

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(init.body as string)).toEqual({
        allergen_ids: ['id-leite'],
        new_term: 'castanha-do-para',
      });
    });

    it('propagates the rejection when the request fails', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({}) });
      const service = createProfileService(authentication);

      await expect(service.updateAllergies(['id-leite'])).rejects.toBeInstanceOf(ProfileServiceError);
    });
  });
});
