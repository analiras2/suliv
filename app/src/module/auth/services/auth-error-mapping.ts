import type { AppErrorCode } from '@suliv/error-codes';

import { ApiError } from '@/lib/api-error';

const RETRYABLE_FETCH_ERROR_NAME = 'AuthRetryableFetchError';

/** ADR-005 table: Supabase `AuthError.code` to the client codes the login screen explains. */
const SUPABASE_CODE_MAP: Readonly<Record<string, AppErrorCode>> = {
  otp_expired: 'AUTH_LINK_EXPIRED',
  flow_state_expired: 'AUTH_LINK_INVALID',
  flow_state_not_found: 'AUTH_LINK_INVALID',
  bad_code_verifier: 'AUTH_LINK_INVALID',
  bad_jwt: 'AUTH_LINK_INVALID',
  over_email_send_rate_limit: 'AUTH_RATE_LIMITED',
  over_request_rate_limit: 'AUTH_RATE_LIMITED',
  email_address_invalid: 'AUTH_EMAIL_INVALID',
  validation_failed: 'AUTH_EMAIL_INVALID',
};

/** Maps a Supabase `error_code` (from a failure or an incoming URL) to a client code. */
export function mapSupabaseErrorCode(supabaseCode: string | null | undefined): ApiError {
  const mapped = supabaseCode ? SUPABASE_CODE_MAP[supabaseCode] : undefined;
  if (mapped) return new ApiError(mapped, null);
  return new ApiError('UNKNOWN_ERROR', null, [], supabaseCode ?? undefined);
}

/**
 * Converts any Supabase failure into the app's single `ApiError`. The retryable
 * fetch error is matched by name so the mapping holds when the SDK is mocked.
 */
export function mapAuthError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const { name, code } = (error ?? {}) as { name?: unknown; code?: unknown };
  if (name === RETRYABLE_FETCH_ERROR_NAME) {
    return new ApiError('NETWORK_UNAVAILABLE', null);
  }
  return mapSupabaseErrorCode(typeof code === 'string' ? code : undefined);
}
