/* eslint-disable @typescript-eslint/no-require-imports */
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { beforeEach, describe, expect, it } from '@jest/globals';

declare const jest: typeof import('@jest/globals').jest;

type AuthStateListener = (_event: string, session: Session | null) => void;

const mockAuth = {
  exchangeCodeForSession: jest.fn<() => Promise<unknown>>(),
  getSession: jest.fn<() => Promise<unknown>>(),
  onAuthStateChange: jest.fn<(listener: AuthStateListener) => unknown>(),
  signInWithOAuth: jest.fn<() => Promise<unknown>>(),
  signInWithOtp: jest.fn<() => Promise<unknown>>(),
  signOut: jest.fn<() => Promise<unknown>>(),
  setSession: jest.fn<() => Promise<unknown>>(),
};

jest.mock('@supabase/supabase-js', () => {
  const { jest: factoryJest }: typeof import('@jest/globals') = require('@jest/globals');
  return { createClient: factoryJest.fn(() => ({})) };
});
jest.mock('expo-secure-store', () => {
  const { jest: factoryJest }: typeof import('@jest/globals') = require('@jest/globals');
  return {
    deleteItemAsync: factoryJest.fn(),
    getItemAsync: factoryJest.fn(),
    setItemAsync: factoryJest.fn(),
  };
});
jest.mock('expo-web-browser', () => {
  const { jest: factoryJest }: typeof import('@jest/globals') = require('@jest/globals');
  return { openAuthSessionAsync: factoryJest.fn() };
});
jest.mock('expo-linking', () => {
  const { jest: factoryJest }: typeof import('@jest/globals') = require('@jest/globals');
  return {
    addEventListener: factoryJest.fn(),
    createURL: factoryJest.fn((path: string) => `suliv://${path}`),
    getInitialURL: factoryJest.fn<() => Promise<string | null>>().mockResolvedValue(null),
  };
});

// eslint-disable-next-line import/first
import { AUTH_STORAGE_KEY, SupabaseAuthService } from './auth-service';

const session = { access_token: 'access-token' } as Session;
const supabaseOptions = jest.mocked(createClient).mock.calls[0][2];
const authService = new SupabaseAuthService({ auth: mockAuth } as unknown as SupabaseClient);

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.signInWithOtp.mockResolvedValue({ error: null });
    mockAuth.signInWithOAuth.mockResolvedValue({ data: { url: 'https://auth.test' }, error: null });
    mockAuth.signOut.mockResolvedValue({ error: null });
    mockAuth.setSession.mockResolvedValue({ error: null });
    mockAuth.exchangeCodeForSession.mockResolvedValue({ error: null });
    mockAuth.getSession.mockResolvedValue({ data: { session }, error: null });
    jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({
      type: 'cancel',
    } as Awaited<ReturnType<typeof WebBrowser.openAuthSessionAsync>>);
    jest.mocked(Linking.addEventListener).mockReturnValue({
      remove: jest.fn(),
    } as unknown as ReturnType<typeof Linking.addEventListener>);
  });

  it('UT-017 sends a magic link to the supplied email', async () => {
    await authService.signInWithMagicLink('user@example.com');

    expect(mockAuth.signInWithOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      options: { emailRedirectTo: 'suliv://login' },
    });
  });

  it('UT-018 propagates a rejected magic-link request', async () => {
    const error = new Error('Rate limited');
    mockAuth.signInWithOtp.mockRejectedValue(error);

    await expect(authService.signInWithMagicLink('user@example.com')).rejects.toBe(error);
  });

  it('throws an error returned by a magic-link request', async () => {
    const error = new Error('Provider error');
    mockAuth.signInWithOtp.mockResolvedValue({ error });

    await expect(authService.signInWithMagicLink('user@example.com')).rejects.toBe(error);
  });

  it.each(['google', 'apple'] as const)('UT-019 opens the %s OAuth URL', async (provider) => {
    await authService.signInWithOAuth(provider);

    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
      provider,
      options: { redirectTo: 'suliv://login' },
    });
    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith('https://auth.test');
  });

  it('does not open a browser when OAuth has no URL', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({ data: { url: null }, error: null });

    await expect(authService.signInWithOAuth('google')).rejects.toThrow('OAuth URL');
    expect(WebBrowser.openAuthSessionAsync).not.toHaveBeenCalled();
  });

  it('UT-020 signs out locally and clears its secure session', async () => {
    await authService.signOut();

    expect(mockAuth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_STORAGE_KEY);
  });

  it('clears secure storage when sign-out rejects', async () => {
    const error = new Error('Offline');
    mockAuth.signOut.mockRejectedValue(error);

    await expect(authService.signOut()).rejects.toBe(error);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(AUTH_STORAGE_KEY);
  });

  it('returns the current session', async () => {
    await expect(authService.getSession()).resolves.toBe(session);
  });

  it('forwards auth sessions and returns an unsubscribe function', () => {
    const unsubscribe = jest.fn();
    const removeLinkListener = jest.fn();
    const callback = jest.fn();
    mockAuth.onAuthStateChange.mockImplementation((listener) => {
      listener('SIGNED_IN', session);
      return { data: { subscription: { unsubscribe } } };
    });
    jest.mocked(Linking.addEventListener).mockReturnValue({
      remove: removeLinkListener,
    } as unknown as ReturnType<typeof Linking.addEventListener>);

    const stopListening = authService.onAuthStateChange(callback);
    stopListening();

    expect(callback).toHaveBeenCalledWith(session);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(removeLinkListener).toHaveBeenCalledTimes(1);
  });

  it('configures Supabase with the SecureStore adapter', async () => {
    await supabaseOptions?.auth?.storage?.setItem?.('key', 'value');
    await supabaseOptions?.auth?.storage?.getItem?.('key');
    await supabaseOptions?.auth?.storage?.removeItem?.('key');

    expect(supabaseOptions?.auth?.storageKey).toBe(AUTH_STORAGE_KEY);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('key', 'value');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('key');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('key');
  });
});
