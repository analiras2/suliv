import type { ApiErrorBody, ValidationIssue } from '@suliv/error-codes';

import { ApiError, toAdminErrorCode } from './api-error';

const SERVER_ERROR_STATUS_MIN = 500;

interface ErrorBody {
  code?: unknown;
  details?: unknown;
}

function toValidationIssues(details: unknown): ValidationIssue[] {
  if (!Array.isArray(details)) return [];
  return details.filter(
    (issue): issue is ValidationIssue =>
      typeof issue === 'object' &&
      issue !== null &&
      typeof (issue as ValidationIssue).field === 'string' &&
      typeof (issue as ValidationIssue).constraint === 'string',
  );
}

/**
 * Builds the `ApiError` for a non-2xx answer from its parsed body: a known code is
 * kept, an unknown or missing one becomes `UNKNOWN_ERROR` (4xx) or
 * `SERVER_UNAVAILABLE` (5xx) while the status and raw code are preserved.
 */
export function apiErrorFromBody(status: number, body: unknown): ApiError {
  const { code, details } = (typeof body === 'object' && body !== null ? body : {}) as ErrorBody;
  const rawCode = typeof code === 'string' ? code : undefined;
  const knownCode = toAdminErrorCode(rawCode);
  if (knownCode) {
    return new ApiError(knownCode, status, toValidationIssues(details));
  }
  const fallbackCode = status >= SERVER_ERROR_STATUS_MIN ? 'SERVER_UNAVAILABLE' : 'UNKNOWN_ERROR';
  return new ApiError(fallbackCode, status, [], rawCode);
}

export async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  return apiErrorFromBody(response.status, body);
}

/** The body a route handler answers with for an error it produces itself (ADR-001). */
export function buildErrorBody(
  statusCode: number,
  code: ApiErrorBody['code'],
  message: string,
  details?: ValidationIssue[],
): ApiErrorBody {
  return { statusCode, code, message, ...(details ? { details } : {}) };
}
