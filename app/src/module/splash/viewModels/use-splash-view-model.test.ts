import type { Session } from '@supabase/supabase-js';
import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { AuthService } from '@/module/auth/services/auth-service';
import type {
  CriticalDataResult,
  CriticalDataService,
  ProfileSnapshot,
} from '@/module/splash/services/critical-data-service';

jest.mock('@/module/auth/services/auth-service', () => ({ authService: {} }));
jest.mock('@/module/splash/services/critical-data-service', () => ({ criticalDataService: {} }));

// eslint-disable-next-line import/first
import { useSplashViewModel } from './use-splash-view-model';

const session = { access_token: 'access-token' } as Session;

const onlineProfile: ProfileSnapshot = {
  id: 'user-1',
  name: 'Ana',
  username: 'ana',
  avatarUrl: null,
  onboardingCompletedAt: '2026-01-01T00:00:00.000Z',
  cachedAt: '2026-01-01T00:00:00.000Z',
};

const incompleteProfile: ProfileSnapshot = { ...onlineProfile, onboardingCompletedAt: null };

describe('useSplashViewModel', () => {
  let authentication: jest.Mocked<AuthService>;
  let dataService: jest.Mocked<CriticalDataService>;

  beforeEach(() => {
    jest.clearAllMocks();
    authentication = {
      getSession: jest.fn<() => Promise<Session | null>>().mockResolvedValue(session),
      onAuthStateChange: jest.fn(() => jest.fn()),
      signInWithMagicLink: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    };
    dataService = {
      load: jest.fn<() => Promise<CriticalDataResult>>().mockResolvedValue({ kind: 'online', profile: onlineProfile }),
    };
  });

  it('resolves ready/(auth) immediately when there is no session, without loading data', async () => {
    authentication.getSession.mockResolvedValue(null);
    const { result } = await renderHook(() => useSplashViewModel(dataService, authentication));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.initialRoute).toBe('(auth)');
    expect(dataService.load).not.toHaveBeenCalled();
  });

  it('resolves ready/(tabs) when online and onboarding is complete', async () => {
    const { result } = await renderHook(() => useSplashViewModel(dataService, authentication));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.initialRoute).toBe('(tabs)');
  });

  it('resolves ready/(onboarding) when online and onboarding is incomplete', async () => {
    dataService.load.mockResolvedValue({ kind: 'online', profile: incompleteProfile });
    const { result } = await renderHook(() => useSplashViewModel(dataService, authentication));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.initialRoute).toBe('(onboarding)');
  });

  it('resolves offline/(tabs) when offline and the cached profile completed onboarding', async () => {
    dataService.load.mockResolvedValue({ kind: 'offline', profile: onlineProfile });
    const { result } = await renderHook(() => useSplashViewModel(dataService, authentication));

    await waitFor(() => expect(result.current.status).toBe('offline'));
    expect(result.current.initialRoute).toBe('(tabs)');
  });

  it('resolves offline/(onboarding) when offline and the cached profile did not complete onboarding', async () => {
    dataService.load.mockResolvedValue({ kind: 'offline', profile: incompleteProfile });
    const { result } = await renderHook(() => useSplashViewModel(dataService, authentication));

    await waitFor(() => expect(result.current.status).toBe('offline'));
    expect(result.current.initialRoute).toBe('(onboarding)');
  });

  it('resolves error/null when the data is unavailable', async () => {
    dataService.load.mockResolvedValue({ kind: 'unavailable' });
    const { result } = await renderHook(() => useSplashViewModel(dataService, authentication));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.initialRoute).toBeNull();
  });

  it('retry() re-invokes load() and can transition from error back to ready', async () => {
    dataService.load.mockResolvedValueOnce({ kind: 'unavailable' });
    const { result } = await renderHook(() => useSplashViewModel(dataService, authentication));
    await waitFor(() => expect(result.current.status).toBe('error'));

    dataService.load.mockResolvedValueOnce({ kind: 'online', profile: onlineProfile });
    result.current.retry();

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.initialRoute).toBe('(tabs)');
    expect(dataService.load).toHaveBeenCalledTimes(2);
  });
});
