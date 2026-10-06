/* eslint-disable @typescript-eslint/no-require-imports */
import type { SupabaseClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockAuth = {
  exchangeCodeForSession: jest.fn<() => Promise<unknown>>(),
  onAuthStateChange: jest.fn<() => unknown>(),
  signInWithOAuth: jest.fn<() => Promise<unknown>>(),
  signInWithOtp: jest.fn<() => Promise<unknown>>(),
};

jest.mock('@supabase/supabase-js', () => {
  const { jest: factoryJest }: typeof import('@jest/globals') = require('@jest/globals');
  return { createClient: factoryJest.fn(() => ({})) };
});
jest.mock('expo-secure-store', () => {
  const { jest: factoryJest }: typeof import('@jest/globals') = require('@jest/globals');
  return { deleteItemAsync: factoryJest.fn(), getItemAsync: factoryJest.fn(), setItemAsync: factoryJest.fn() };
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

/* eslint-disable import/first */
import { ApiError } from '@/lib/api-error';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import { SupabaseAuthService } from './auth-service';
/* eslint-enable import/first */

const service = new SupabaseAuthService({ auth: mockAuth } as unknown as SupabaseClient);

type UrlListener = (event: { url: string }) => void;

function supabaseError(code: string | undefined, name = 'AuthApiError') {
  return Object.assign(new Error('supabase failure'), { code, name });
}

describe('AuthService error mapping (ADR-005)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({ authNotice: null });
    mockAuth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
  });

  it('UT-047 maps the email rate limit to AUTH_RATE_LIMITED', async () => {
    mockAuth.signInWithOtp.mockResolvedValue({ error: supabaseError('over_email_send_rate_limit') });

    await expect(service.signInWithMagicLink('user@example.com')).rejects.toMatchObject({
      code: 'AUTH_RATE_LIMITED',
    });
  });

  it.each([
    ['otp_expired', 'AUTH_LINK_EXPIRED'],
    ['flow_state_expired', 'AUTH_LINK_INVALID'],
    ['bad_code_verifier', 'AUTH_LINK_INVALID'],
    ['email_address_invalid', 'AUTH_EMAIL_INVALID'],
    ['validation_failed', 'AUTH_EMAIL_INVALID'],
  ])('UT-048 maps the Supabase code %s to %s', async (supabaseCode, expectedCode) => {
    mockAuth.signInWithOtp.mockResolvedValue({ error: supabaseError(supabaseCode) });

    await expect(service.signInWithMagicLink('user@example.com')).rejects.toMatchObject({ code: expectedCode });
  });

  it('UT-049 maps a retryable fetch error to NETWORK_UNAVAILABLE', async () => {
    mockAuth.signInWithOtp.mockResolvedValue({
      error: supabaseError(undefined, 'AuthRetryableFetchError'),
    });

    await expect(service.signInWithMagicLink('user@example.com')).rejects.toMatchObject({
      code: 'NETWORK_UNAVAILABLE',
    });
  });

  it('keeps an unknown Supabase code as UNKNOWN_ERROR with its raw code', async () => {
    mockAuth.signInWithOtp.mockResolvedValue({ error: supabaseError('something_new') });

    const failure = await service.signInWithMagicLink('user@example.com').catch((caught: unknown) => caught);

    expect(failure).toBeInstanceOf(ApiError);
    expect(failure).toMatchObject({ code: 'UNKNOWN_ERROR', rawCode: 'something_new' });
  });

  it('UT-050 rejects with AUTH_PROVIDER_FAILED when OAuth returns no URL', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({ data: { url: null }, error: null });

    await expect(service.signInWithOAuth('google')).rejects.toMatchObject({ code: 'AUTH_PROVIDER_FAILED' });
    expect(WebBrowser.openAuthSessionAsync).not.toHaveBeenCalled();
  });

  it('UT-051 records an error carried by an incoming URL as an auth notice without throwing', async () => {
    let urlListener: UrlListener | undefined;
    jest.mocked(Linking.addEventListener).mockImplementation(((_event: string, listener: UrlListener) => {
      urlListener = listener;
      return { remove: jest.fn() };
    }) as unknown as typeof Linking.addEventListener);
    service.onAuthStateChange(jest.fn());

    urlListener?.({ url: 'suliv://login#error=access_denied&error_code=otp_expired' });
    await new Promise((resolve) => setImmediate(resolve));

    expect(useSessionStore.getState().authNotice).toBe('AUTH_LINK_EXPIRED');
    expect(mockAuth.exchangeCodeForSession).not.toHaveBeenCalled();
  });
});
