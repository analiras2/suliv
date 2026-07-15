/* eslint-disable @typescript-eslint/no-require-imports */
import type { SupabaseClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockAuth = {
  exchangeCodeForSession: jest.fn<() => Promise<{ error: null }>>(),
  onAuthStateChange: jest.fn<() => unknown>(),
  setSession: jest.fn<() => Promise<{ error: null }>>(),
  signInWithOAuth: jest.fn<() => Promise<unknown>>(),
};

jest.mock('@supabase/supabase-js', () => {
  const { jest: factoryJest }: typeof import('@jest/globals') = require('@jest/globals');
  return { createClient: factoryJest.fn(() => ({})) };
});
jest.mock('expo-secure-store', () => {
  const { jest: factoryJest }: typeof import('@jest/globals') = require('@jest/globals');
  return {
    deleteItemAsync: factoryJest.fn(), getItemAsync: factoryJest.fn(), setItemAsync: factoryJest.fn(),
  };
});
jest.mock('expo-linking', () => {
  const { jest: factoryJest }: typeof import('@jest/globals') = require('@jest/globals');
  return {
    addEventListener: factoryJest.fn(),
    createURL: factoryJest.fn((path: string) => `suliv://${path}`),
    getInitialURL: factoryJest.fn<() => Promise<string | null>>().mockResolvedValue(null),
  };
});
jest.mock('expo-web-browser', () => {
  const { jest: factoryJest }: typeof import('@jest/globals') = require('@jest/globals');
  return { openAuthSessionAsync: factoryJest.fn() };
});

// eslint-disable-next-line import/first
import { SupabaseAuthService } from './auth-service';

const service = new SupabaseAuthService({ auth: mockAuth } as unknown as SupabaseClient);

describe('AuthService callbacks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.exchangeCodeForSession.mockResolvedValue({ error: null });
    mockAuth.setSession.mockResolvedValue({ error: null });
    mockAuth.signInWithOAuth.mockResolvedValue({ data: { url: 'https://auth.test' }, error: null });
  });

  it('establishes the OAuth session returned by the browser', async () => {
    jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({
      type: 'success', url: 'suliv://login#access_token=access&refresh_token=refresh',
    });
    await service.signInWithOAuth('google');
    expect(mockAuth.setSession).toHaveBeenCalledWith({
      access_token: 'access', refresh_token: 'refresh',
    });
  });

  it('exchanges a PKCE code received through an app deep link', async () => {
    let listener: ((event: { url: string }) => void) | undefined;
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    jest.mocked(Linking.addEventListener).mockImplementation((_event, callback) => {
      listener = callback;
      return { remove: jest.fn() } as unknown as ReturnType<typeof Linking.addEventListener>;
    });
    service.onAuthStateChange(jest.fn());
    listener?.({ url: 'suliv://login?code=pkce-code' });
    await Promise.resolve();
    expect(mockAuth.exchangeCodeForSession).toHaveBeenCalledWith('pkce-code');
  });

  it('establishes a session from the URL that cold-launched the app (e.g. a tapped magic link)', async () => {
    const coldStartService = new SupabaseAuthService({ auth: mockAuth } as unknown as SupabaseClient);
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    jest.mocked(Linking.addEventListener).mockReturnValue({
      remove: jest.fn(),
    } as unknown as ReturnType<typeof Linking.addEventListener>);
    jest.mocked(Linking.getInitialURL).mockResolvedValue(
      'suliv://login#access_token=access&refresh_token=refresh',
    );

    coldStartService.onAuthStateChange(jest.fn());
    await Promise.resolve();
    await Promise.resolve();

    expect(mockAuth.setSession).toHaveBeenCalledWith({
      access_token: 'access', refresh_token: 'refresh',
    });
  });

  it('does not re-check the initial URL on a second onAuthStateChange call from another view model', async () => {
    const sharedService = new SupabaseAuthService({ auth: mockAuth } as unknown as SupabaseClient);
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    jest.mocked(Linking.addEventListener).mockReturnValue({
      remove: jest.fn(),
    } as unknown as ReturnType<typeof Linking.addEventListener>);
    jest.mocked(Linking.getInitialURL).mockResolvedValue(
      'suliv://login#access_token=access&refresh_token=refresh',
    );

    sharedService.onAuthStateChange(jest.fn());
    sharedService.onAuthStateChange(jest.fn());
    await Promise.resolve();
    await Promise.resolve();

    expect(Linking.getInitialURL).toHaveBeenCalledTimes(1);
  });
});
