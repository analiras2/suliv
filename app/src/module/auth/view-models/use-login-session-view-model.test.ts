import type { Session } from '@supabase/supabase-js';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { AuthService } from '@/module/auth/services/auth-service';
import type { ProfileService } from '@/module/auth/services/profile-service';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import type { UserProfile } from '@/module/auth/types';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/module/auth/services/auth-service', () => ({ authService: {} }));

// eslint-disable-next-line import/first
import { useLoginViewModel } from './use-login-view-model';

const session = { access_token: 'access-token' } as Session;
const user = { id: 'user-1', name: 'Ana' } as UserProfile;

describe('useLoginViewModel session orchestration', () => {
  let authListener: (value: Session | null) => void;
  let authentication: jest.Mocked<AuthService>;
  let profiles: jest.Mocked<ProfileService>;

  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({ session: null, status: 'unauthenticated', user: null });
    authentication = {
      getSession: jest.fn<() => Promise<Session | null>>().mockResolvedValue(null),
      onAuthStateChange: jest.fn((listener) => { authListener = listener; return jest.fn(); }),
      signInWithMagicLink: jest.fn(),
      signInWithOAuth: jest.fn<(provider: 'google' | 'apple') => Promise<void>>().mockResolvedValue(),
      signOut: jest.fn(),
    };
    profiles = {
      bootstrap: jest.fn<(value: Session) => Promise<{ missingName: boolean; user: UserProfile }>>()
        .mockResolvedValue({ missingName: false, user }),
      deleteMe: jest.fn(),
      getMe: jest.fn(),
      updateName: jest.fn(),
    };
  });

  it.each([
    { missingName: false, route: '/' },
    { missingName: true, route: '/complete-profile' },
  ])('routes a bootstrapped session to $route', async ({ missingName, route }) => {
    profiles.bootstrap.mockResolvedValue({ missingName, user });
    await renderHook(() => useLoginViewModel(authentication, profiles));
    await act(() => authListener(session));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(route));
    expect(useSessionStore.getState().user).toBe(user);
  });

  it('ignores null and duplicate auth events', async () => {
    await renderHook(() => useLoginViewModel(authentication, profiles));
    await act(() => authListener(null));
    await act(() => authListener(session));
    await act(() => authListener(session));
    expect(profiles.bootstrap).toHaveBeenCalledTimes(1);
  });

  it('exposes unknown bootstrap failures without navigating', async () => {
    profiles.bootstrap.mockRejectedValue('offline');
    const { result } = await renderHook(() => useLoginViewModel(authentication, profiles));
    await act(() => authListener(session));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('bootstraps the session returned after OAuth', async () => {
    authentication.getSession.mockResolvedValue(session);
    const { result } = await renderHook(() => useLoginViewModel(authentication, profiles));
    await act(() => result.current.signInWithOAuth('google'));
    expect(profiles.bootstrap).toHaveBeenCalledWith(session);
  });

  it.each([new Error('OAuth failed'), 'offline'])('exposes OAuth failure %p', async (failure) => {
    authentication.signInWithOAuth.mockRejectedValue(failure);
    const { result } = await renderHook(() => useLoginViewModel(authentication, profiles));
    await act(() => result.current.signInWithOAuth('google'));
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBeTruthy();
  });
});
