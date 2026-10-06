import type { ValidationIssue } from '@suliv/error-codes';

import { ApiError, toAppErrorCode } from '@/lib/api-error';

const SERVER_ERROR_STATUS_MIN = 500;

interface ErrorBody {
  code?: unknown;
  details?: unknown;
}

async function readErrorBody(response: Response): Promise<ErrorBody | null> {
  try {
    const body: unknown = await response.json();
    return typeof body === 'object' && body !== null ? (body as ErrorBody) : null;
  } catch {
    return null;
  }
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
 * Turns a non-2xx response into an `ApiError`: a known wire code is kept, an
 * unknown or missing one becomes `UNKNOWN_ERROR` (4xx) or `SERVER_UNAVAILABLE`
 * (5xx) while the status and the raw code are preserved.
 */
export async function buildApiError(response: Response): Promise<ApiError> {
  const body = await readErrorBody(response);
  const rawCode = typeof body?.code === 'string' ? body.code : undefined;
  const knownCode = toAppErrorCode(rawCode);
  if (knownCode) {
    return new ApiError(knownCode, response.status, toValidationIssues(body?.details));
  }
  const fallbackCode = response.status >= SERVER_ERROR_STATUS_MIN ? 'SERVER_UNAVAILABLE' : 'UNKNOWN_ERROR';
  return new ApiError(fallbackCode, response.status, [], rawCode);
}
