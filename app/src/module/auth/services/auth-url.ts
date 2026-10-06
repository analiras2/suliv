import type { AuthError, SupabaseClient } from '@supabase/supabase-js';

import { ApiError } from '@/lib/api-error';
import { mapAuthError, mapSupabaseErrorCode } from '@/module/auth/services/auth-error-mapping';
import { useSessionStore } from '@/module/auth/store/use-session-store';

export function throwAuthError(error: AuthError | null): void {
  if (error) {
    throw mapAuthError(error);
  }
}

/** Keeps a failed incoming link from disappearing: the login screen shows its copy (ADR-005). */
export function recordAuthNotice(caught: unknown): void {
  if (caught instanceof ApiError) {
    useSessionStore.getState().setAuthNotice(caught.code);
  }
}

function noticeForUrlError(errorCode: string | null): ApiError {
  const mapped = errorCode ? mapSupabaseErrorCode(errorCode) : null;
  return mapped && mapped.code !== 'UNKNOWN_ERROR' ? mapped : new ApiError('AUTH_PROVIDER_FAILED', null);
}

/**
 * Finishes a sign-in from a magic-link or OAuth redirect URL. An error carried
 * by the URL becomes an auth notice instead of being thrown away; failures of
 * the session exchange itself are thrown as `ApiError`.
 */
export async function completeSignInFromUrl(client: SupabaseClient, url: string): Promise<void> {
  const parsedUrl = new URL(url);
  const query = parsedUrl.searchParams;
  const fragment = new URLSearchParams(parsedUrl.hash.slice(1));
  const urlErrorCode = query.get('error_code') ?? fragment.get('error_code');
  const urlError = query.get('error') ?? fragment.get('error');
  if (urlErrorCode || urlError) {
    recordAuthNotice(noticeForUrlError(urlErrorCode));
    return;
  }

  const code = query.get('code');
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    throwAuthError(error);
    return;
  }

  const accessToken = query.get('access_token') ?? fragment.get('access_token');
  const refreshToken = query.get('refresh_token') ?? fragment.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    throwAuthError(error);
  }
}
