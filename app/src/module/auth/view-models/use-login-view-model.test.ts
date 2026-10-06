import type { Session } from '@supabase/supabase-js';
import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AUTH_MESSAGES, ERROR_MESSAGES } from '@/lib/error-messages';
import type { AuthService } from '@/module/auth/services/auth-service';
import type { ProfileService } from '@/module/auth/services/profile-service';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import type { UserProfile } from '@/module/auth/types';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/module/auth/services/auth-service', () => ({ authService: {} }));

// eslint-disable-next-line import/first
import { useLoginViewModel } from './use-login-view-model';

const user = { id: 'user-1', name: 'Ana' } as UserProfile;

describe('useLoginViewModel', () => {
  let authentication: jest.Mocked<AuthService>;
  let profiles: jest.Mocked<ProfileService>;

  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({ session: null, status: 'unauthenticated', user: null, authNotice: null });
    authentication = {
      getSession: jest.fn<() => Promise<Session | null>>().mockResolvedValue(null),
      onAuthStateChange: jest.fn(() => jest.fn()),
      signInWithMagicLink: jest.fn<(email: string) => Promise<void>>().mockResolvedValue(undefined),
      signInWithOAuth: jest.fn<(provider: 'google' | 'apple') => Promise<void>>().mockResolvedValue(undefined),
      signOut: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };
    profiles = {
      bootstrap: jest.fn<() => Promise<{ missingName: boolean; user: UserProfile }>>()
        .mockResolvedValue({ missingName: false, user }),
      deleteMe: jest.fn(),
      getMe: jest.fn(),
      updateName: jest.fn<(name: string) => Promise<UserProfile>>(),
    };
  });

  it('UT-023 sends a valid magic link and exposes sent status', async () => {
    const { result } = await renderHook(() => useLoginViewModel(authentication, profiles));
    await act(() => result.current.setEmail('user@example.com'));

    await act(() => result.current.submitEmail());

    expect(authentication.signInWithMagicLink).toHaveBeenCalledWith('user@example.com');
    expect(result.current.status).toBe('sent');
  });

  it('UT-024 exposes an error when magic-link submission rejects', async () => {
    authentication.signInWithMagicLink.mockRejectedValue(new Error('Provider unavailable'));
    const { result } = await renderHook(() => useLoginViewModel(authentication, profiles));
    await act(() => result.current.setEmail('user@example.com'));

    await act(() => result.current.submitEmail());

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBeTruthy();
  });

  it('rejects invalid email without calling the provider', async () => {
    const { result } = await renderHook(() => useLoginViewModel(authentication, profiles));
    await act(() => result.current.setEmail('invalid'));
    await act(() => result.current.submitEmail());
    expect(authentication.signInWithMagicLink).not.toHaveBeenCalled();
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(AUTH_MESSAGES.invalidEmail);
  });

  it('starts OAuth and returns to idle when no session is established', async () => {
    const { result } = await renderHook(() => useLoginViewModel(authentication, profiles));
    await act(() => result.current.signInWithOAuth('apple'));
    expect(authentication.signInWithOAuth).toHaveBeenCalledWith('apple');
    expect(result.current.status).toBe('idle');
  });

  it('uses a safe message for a non-Error provider rejection', async () => {
    authentication.signInWithMagicLink.mockRejectedValue('offline');
    const { result } = await renderHook(() => useLoginViewModel(authentication, profiles));
    await act(() => result.current.setEmail('user@example.com'));
    await act(() => result.current.submitEmail());
    expect(result.current.error).toBe(AUTH_MESSAGES.magicLinkFailed);
  });

  it('UT-052 exposes the copy of an expired-link notice', async () => {
    useSessionStore.setState({ authNotice: 'AUTH_LINK_EXPIRED' });

    const { result } = await renderHook(() => useLoginViewModel(authentication, profiles));

    expect(result.current.error).toBe(ERROR_MESSAGES.AUTH_LINK_EXPIRED);
  });

  it('UT-053 clears the notice and the error when a new link is sent', async () => {
    useSessionStore.setState({ authNotice: 'AUTH_LINK_EXPIRED' });
    const { result } = await renderHook(() => useLoginViewModel(authentication, profiles));
    await act(() => result.current.setEmail('user@example.com'));

    await act(() => result.current.submitEmail());

    expect(useSessionStore.getState().authNotice).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('UT-054 clears the notice when a session is processed', async () => {
    const emitter: { emit?: (session: Session | null) => void } = {};
    authentication.onAuthStateChange.mockImplementation((callback) => {
      emitter.emit = callback;
      return jest.fn();
    });
    useSessionStore.setState({ authNotice: 'AUTH_SESSION_EXPIRED' });
    await renderHook(() => useLoginViewModel(authentication, profiles));

    await act(async () => emitter.emit?.({ access_token: 'token-1' } as Session));

    expect(useSessionStore.getState().authNotice).toBeNull();
  });

  it('UT-055 exposes the session-expired copy', async () => {
    useSessionStore.setState({ authNotice: 'AUTH_SESSION_EXPIRED' });

    const { result } = await renderHook(() => useLoginViewModel(authentication, profiles));

    expect(result.current.error).toBe('Sua sessão expirou. Entre novamente.');
  });
});
