import type { Session } from '@supabase/supabase-js';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Alert } from 'react-native';

import type { AuthService } from '@/module/auth/services/auth-service';
import type { ProfileService } from '@/module/auth/services/profile-service';
import { useSessionStore } from '@/module/auth/store/use-session-store';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/module/auth/services/auth-service', () => ({
  authService: { getSession: jest.fn(), onAuthStateChange: jest.fn(), signInWithMagicLink: jest.fn(),
    signInWithOAuth: jest.fn(), signOut: jest.fn() },
}));
jest.mock('@/module/auth/services/profile-service', () => ({
  profileService: { bootstrap: jest.fn(), deleteMe: jest.fn(), getMe: jest.fn(), updateName: jest.fn() },
}));

// eslint-disable-next-line import/first
import { useAccountViewModel } from './use-account-view-model';

const session = { access_token: 'access-token' } as Session;

describe('useAccountViewModel', () => {
  let authentication: jest.Mocked<AuthService>;
  let profiles: jest.Mocked<ProfileService>;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    useSessionStore.setState({ session, status: 'authenticated', user: null });
    authentication = {
      getSession: jest.fn(), onAuthStateChange: jest.fn(), signInWithMagicLink: jest.fn(),
      signInWithOAuth: jest.fn(), signOut: jest.fn<() => Promise<void>>().mockResolvedValue(),
    };
    profiles = {
      bootstrap: jest.fn(), deleteMe: jest.fn<(value: Session) => Promise<void>>().mockResolvedValue(),
      getMe: jest.fn(), updateName: jest.fn(),
    };
  });

  it('UT-025 confirms deletion, calls DELETE /me, and clears local auth', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { result } = await renderHook(() => useAccountViewModel(authentication, profiles));

    await act(() => result.current.requestAccountDeletion());
    const buttons = alert.mock.calls[0][2];
    expect(buttons?.[1]).toMatchObject({ style: 'destructive', text: 'Excluir conta' });
    await act(() => result.current.deleteAccount());

    await waitFor(() => expect(profiles.deleteMe).toHaveBeenCalledWith(session));
    expect(authentication.signOut).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState()).toMatchObject({ session: null, user: null, status: 'unauthenticated' });
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('keeps the session and exposes an API deletion error', async () => {
    profiles.deleteMe.mockRejectedValue('offline');
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { result } = await renderHook(() => useAccountViewModel(authentication, profiles));
    await act(() => result.current.requestAccountDeletion());
    expect(alert).toHaveBeenCalledTimes(1);
    await act(() => result.current.deleteAccount());
    await waitFor(() => expect(result.current.error).toBe('Unable to delete your account.'));
    expect(useSessionStore.getState().session).toBe(session);
  });

  it('exposes a service error without clearing the session', async () => {
    profiles.deleteMe.mockRejectedValue(new Error('API unavailable'));
    const { result } = await renderHook(() => useAccountViewModel(authentication, profiles));
    await act(() => result.current.deleteAccount());
    expect(result.current.error).toBe('API unavailable');
    expect(useSessionStore.getState().session).toBe(session);
  });

  it('clears local auth when provider sign-out fails after deletion', async () => {
    authentication.signOut.mockRejectedValue(new Error('Already deleted'));
    const { result } = await renderHook(() => useAccountViewModel(authentication, profiles));
    await act(() => result.current.deleteAccount());
    expect(useSessionStore.getState().session).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('returns to login when deletion is requested without a session', async () => {
    useSessionStore.getState().setSession(null);
    const { result } = await renderHook(() => useAccountViewModel());
    await act(() => result.current.deleteAccount());
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
    expect(profiles.deleteMe).not.toHaveBeenCalled();
  });
});
