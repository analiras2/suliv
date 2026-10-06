import { API_ERRORS, isApiErrorCode, type AppErrorCode, type ValidationIssue } from '@suliv/error-codes';

/**
 * The single error the app throws for any failed request, whether the API
 * answered (ADR-001), the request never got a response, or Supabase Auth failed
 * (ADR-005). `status` is `null` for client-side codes; `rawCode` keeps an
 * unrecognised wire code so it can be reported (ADR-007).
 */
export class ApiError extends Error {
  constructor(
    readonly code: AppErrorCode,
    readonly status: number | null,
    readonly details: ValidationIssue[] = [],
    readonly rawCode?: string,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

/** Narrows a wire code to one the app has copy for; admin-only codes are not the app's concern. */
export function toAppErrorCode(value: unknown): AppErrorCode | null {
  if (!isApiErrorCode(value) || API_ERRORS[value].audience === 'admin') {
    return null;
  }
  return value as AppErrorCode;
}
