import { API_ERRORS, isApiErrorCode, type AdminErrorCode, type ValidationIssue } from '@suliv/error-codes';

/**
 * The single error the admin client throws for a failed request (ADR-001). `status`
 * is `null` when no response arrived; `rawCode` keeps an unrecognised wire code so
 * it can be reported (ADR-007). The message is the code: screens never show it.
 */
export class ApiError extends Error {
  constructor(
    readonly code: AdminErrorCode,
    readonly status: number | null,
    readonly details: ValidationIssue[] = [],
    readonly rawCode?: string,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

/** Narrows a wire code to one the panel has copy for; codes meant only for the app are unknown here. */
export function toAdminErrorCode(value: unknown): AdminErrorCode | null {
  if (!isApiErrorCode(value) || API_ERRORS[value].audience === 'user') {
    return null;
  }
  return value as AdminErrorCode;
}
