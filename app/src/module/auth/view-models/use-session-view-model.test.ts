import type { Session } from '@supabase/supabase-js';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { AuthService } from '@/module/auth/services/auth-service';
import { ProfileServiceError, type ProfileService } from '@/module/auth/services/profile-service';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import type { UserProfile } from '@/module/auth/types';

const mockReplace = jest.fn();
let mockSegments = ['(tabs)'];
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSegments: () => mockSegments,
}));
jest.mock('@/module/auth/services/auth-service', () => ({ authService: {} }));

// eslint-disable-next-line import/first
import { useSessionViewModel } from './use-session-view-model';

const session = { access_token: 'access-token' } as Session;
const user = { id: 'user-1', name: 'Ana' } as UserProfile;

describe('useSessionViewModel', () => {
  let authListener: (value: Session | null) => void;
  let authentication: jest.Mocked<AuthService>;
  let profiles: jest.Mocked<ProfileService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSegments = ['(tabs)'];
    useSessionStore.setState({ session: null, status: 'loading', user: null });
    authentication = {
      getSession: jest.fn<() => Promise<Session | null>>().mockResolvedValue(session),
      onAuthStateChange: jest.fn((listener) => { authListener = listener; return jest.fn(); }),
      signInWithMagicLink: jest.fn(),
      signInWithOAuth: jest.fn(), signOut: jest.fn<() => Promise<void>>().mockResolvedValue(),
    };
    profiles = {
      bootstrap: jest.fn<(value: Session) => Promise<{ missingName: boolean; user: UserProfile }>>()
        .mockResolvedValue({ missingName: false, user }),
      deleteMe: jest.fn(), getMe: jest.fn(), updateName: jest.fn(),
    };
  });

  it('restores, bootstraps, hydrates, and routes a persisted session', async () => {
    await renderHook(() => useSessionViewModel(authentication, profiles));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
    expect(profiles.bootstrap).toHaveBeenCalledWith(session);
    expect(useSessionStore.getState()).toMatchObject({ session, user, status: 'authenticated' });
  });

  it('routes a restored incomplete profile to completion', async () => {
    profiles.bootstrap.mockResolvedValue({ missingName: true, user });
    await renderHook(() => useSessionViewModel(authentication, profiles));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/complete-profile'));
  });

  it('marks an absent session unauthenticated', async () => {
    authentication.getSession.mockResolvedValue(null);
    await renderHook(() => useSessionViewModel(authentication, profiles));
    await waitFor(() => expect(useSessionStore.getState().status).toBe('unauthenticated'));
    expect(profiles.bootstrap).not.toHaveBeenCalled();
  });

  it('clears an unauthorized restored session', async () => {
    profiles.bootstrap.mockRejectedValue(new ProfileServiceError(401));
    authentication.signOut.mockRejectedValue(new Error('Already expired'));
    await renderHook(() => useSessionViewModel(authentication, profiles));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
    expect(authentication.signOut).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState().session).toBeNull();
  });

  it('keeps a valid cached session available when bootstrap is offline', async () => {
    profiles.bootstrap.mockRejectedValue(new Error('offline'));
    const { result } = await renderHook(() => useSessionViewModel(authentication, profiles));
    await waitFor(() => expect(result.current.error).toBe('offline'));
    expect(useSessionStore.getState().status).toBe('authenticated');
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('marks restoration failures without a cached session unauthenticated', async () => {
    authentication.getSession.mockRejectedValue('offline');
    const { result } = await renderHook(() => useSessionViewModel(authentication, profiles));
    await waitFor(() => expect(result.current.error).toBe('Unable to restore your session.'));
    expect(useSessionStore.getState().status).toBe('unauthenticated');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('applies auth changes after startup restoration is complete', async () => {
    await renderHook(() => useSessionViewModel(authentication, profiles));
    await waitFor(() => expect(useSessionStore.getState().status).toBe('authenticated'));
    await act(() => authListener(null));
    await waitFor(() => expect(useSessionStore.getState().status).toBe('unauthenticated'));
  });

  it('redirects a hydrated authenticated user away from auth routes', async () => {
    mockSegments = ['(auth)', 'login'];
    await renderHook(() => useSessionViewModel(authentication, profiles));
    await waitFor(() => expect(useSessionStore.getState().user).toBe(user));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
