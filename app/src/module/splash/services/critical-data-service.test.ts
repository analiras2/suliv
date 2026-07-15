import type { Session } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { OfflineCache } from '@/lib/offline-cache';
import type { AuthService } from '@/module/auth/services/auth-service';
import type { ProfileService } from '@/module/auth/services/profile-service';
import type { UserProfile } from '@/module/auth/types';

jest.mock('@/module/auth/services/auth-service', () => ({ authService: {} }));
jest.mock('@/module/auth/services/profile-service', () => ({ profileService: {} }));
jest.mock('@/lib/offline-cache', () => ({ offlineCache: {} }));

// eslint-disable-next-line import/first
import {
  createCriticalDataService,
  PROFILE_SNAPSHOT_CACHE_KEY,
  type ProfileSnapshot,
} from './critical-data-service';

const session = { access_token: 'access-token' } as Session;

const profile: UserProfile = {
  id: 'user-1',
  email: 'ana@example.com',
  name: 'Ana',
  username: 'ana',
  usernameUpdatedAt: null,
  avatarUrl: null,
  dietPreference: null,
  cookingLevel: null,
  cookingFrequency: null,
  onboardingCompletedAt: '2026-01-01T00:00:00.000Z',
  termsVersionAccepted: null,
  termsAcceptedAt: null,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const cachedSnapshot: ProfileSnapshot = {
  id: 'user-1',
  name: 'Ana (cached)',
  username: 'ana',
  avatarUrl: null,
  onboardingCompletedAt: '2025-01-01T00:00:00.000Z',
  cachedAt: '2025-01-01T00:00:00.000Z',
};

describe('critical-data-service', () => {
  let authentication: jest.Mocked<AuthService>;
  let profiles: jest.Mocked<ProfileService>;
  let cache: jest.Mocked<OfflineCache>;

  beforeEach(() => {
    jest.clearAllMocks();
    authentication = {
      getSession: jest.fn<() => Promise<Session | null>>().mockResolvedValue(session),
      onAuthStateChange: jest.fn(() => jest.fn()),
      signInWithMagicLink: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    };
    profiles = {
      bootstrap: jest.fn(),
      getMe: jest.fn<ProfileService['getMe']>().mockResolvedValue(profile),
      updateName: jest.fn(),
      deleteMe: jest.fn(),
    };
    cache = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<OfflineCache>;
  });

  it('resolves unavailable without calling GET /me when there is no session', async () => {
    authentication.getSession.mockResolvedValue(null);
    const service = createCriticalDataService(authentication, profiles, cache);

    const result = await service.load();

    expect(result).toEqual({ kind: 'unavailable' });
    expect(profiles.getMe).not.toHaveBeenCalled();
  });

  it('returns online and caches a fresh snapshot on success', async () => {
    const service = createCriticalDataService(authentication, profiles, cache);

    const result = await service.load();

    expect(result.kind).toBe('online');
    expect(cache.set).toHaveBeenCalledWith(
      PROFILE_SNAPSHOT_CACHE_KEY,
      expect.objectContaining({ id: 'user-1', onboardingCompletedAt: profile.onboardingCompletedAt }),
    );
  });

  it('overwrites a stale cached snapshot on a fresh success', async () => {
    const service = createCriticalDataService(authentication, profiles, cache);
    await service.load();

    const [, written] = cache.set.mock.calls[0] as [string, ProfileSnapshot];
    cache.get.mockReturnValue(written);
    profiles.getMe.mockResolvedValue({ ...profile, name: 'Ana Updated' });

    await service.load();

    const [, secondWrite] = cache.set.mock.calls[1] as [string, ProfileSnapshot];
    expect(secondWrite.name).toBe('Ana Updated');
  });

  it('aborts a GET /me call that never resolves once the timeout elapses', async () => {
    jest.useFakeTimers();
    let capturedSignal: AbortSignal | undefined;
    profiles.getMe.mockImplementation(
      (_session, signal) =>
        new Promise((_resolve, reject) => {
          capturedSignal = signal;
          signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const service = createCriticalDataService(authentication, profiles, cache);

    const pending = service.load();
    await jest.runAllTimersAsync();
    const result = await pending;

    expect(capturedSignal?.aborted).toBe(true);
    expect(result).toEqual({ kind: 'unavailable' });
    jest.useRealTimers();
  });

  it('falls back to the cached snapshot when GET /me fails and a cache entry exists', async () => {
    profiles.getMe.mockRejectedValue(new Error('network down'));
    cache.get.mockReturnValue(cachedSnapshot);
    const service = createCriticalDataService(authentication, profiles, cache);

    const result = await service.load();

    expect(result).toEqual({ kind: 'offline', profile: cachedSnapshot });
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('resolves unavailable when GET /me fails and there is no cached snapshot', async () => {
    profiles.getMe.mockRejectedValue(new Error('network down'));
    cache.get.mockReturnValue(null);
    const service = createCriticalDataService(authentication, profiles, cache);

    const result = await service.load();

    expect(result).toEqual({ kind: 'unavailable' });
  });
});
