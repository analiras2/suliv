/**
 * Single source of truth for the error codes exchanged between the suliv API
 * and its clients (ADR-001, ADR-002).
 *
 * This package is dependency free and must never import from React Native,
 * NestJS or Next. It holds no user-facing copy: each client owns its own
 * pt-BR registry (ADR-006).
 */

/** Who a code is meant for: the app user, the moderation panel, or both. */
export type ErrorAudience = 'user' | 'admin' | 'shared';

/** An entry in the API error catalog: the HTTP status it is served with and its audience. */
export interface ApiErrorDefinition {
  status: number;
  audience: ErrorAudience;
}

/**
 * The API error catalog. Statuses match the API's current behaviour exactly —
 * adopting a code never changes the HTTP status a caller already sees.
 */
export const API_ERRORS = {
  VALIDATION_FAILED: { status: 400, audience: 'shared' },
  BAD_REQUEST: { status: 400, audience: 'shared' },
  UNAUTHORIZED: { status: 401, audience: 'shared' },
  FORBIDDEN: { status: 403, audience: 'shared' },
  NOT_FOUND: { status: 404, audience: 'shared' },
  CONFLICT: { status: 409, audience: 'shared' },
  UNPROCESSABLE: { status: 422, audience: 'shared' },
  RATE_LIMITED: { status: 429, audience: 'shared' },
  INTERNAL_ERROR: { status: 500, audience: 'shared' },
  ADMIN_INVALID_CREDENTIALS: { status: 401, audience: 'admin' },
  RATING_OUT_OF_RANGE: { status: 422, audience: 'user' },
  COMMENT_NOT_FOUND: { status: 404, audience: 'user' },
  COMMENT_NOT_OWNED: { status: 403, audience: 'user' },
  COMMENT_RATE_LIMITED: { status: 429, audience: 'user' },
  USER_NOT_FOUND: { status: 404, audience: 'shared' },
  USERNAME_GENERATION_FAILED: { status: 409, audience: 'user' },
  USERNAME_TAKEN: { status: 409, audience: 'user' },
  USERNAME_CHANGE_TOO_SOON: { status: 422, audience: 'user' },
  USERNAME_INVALID: { status: 400, audience: 'user' },
  USERNAME_PROHIBITED: { status: 400, audience: 'user' },
  RECIPE_NOT_FOUND: { status: 404, audience: 'shared' },
  RECIPE_NOT_OWNED: { status: 403, audience: 'user' },
  CATEGORY_NOT_FOUND: { status: 400, audience: 'user' },
  RECIPE_COVER_REQUIRED: { status: 422, audience: 'user' },
  RECIPE_TERMS_NOT_ACCEPTED: { status: 422, audience: 'user' },
  RECIPE_SUBMISSION_RATE_LIMITED: { status: 429, audience: 'user' },
  SYNC_PAYLOAD_INVALID: { status: 400, audience: 'user' },
  REPORT_DUPLICATE: { status: 409, audience: 'user' },
  REPORT_TARGET_NOT_FOUND: { status: 404, audience: 'user' },
  REPORT_RATE_LIMITED: { status: 429, audience: 'user' },
  REPORT_NOT_FOUND: { status: 404, audience: 'admin' },
  REPORT_ACTION_NOT_APPLICABLE: { status: 400, audience: 'admin' },
  FEATURE_FLAG_NOT_FOUND: { status: 404, audience: 'admin' },
  ALLERGEN_NOT_FOUND: { status: 404, audience: 'admin' },
  ALLERGEN_NOT_PENDING: { status: 409, audience: 'admin' },
  ALLERGEN_NOT_APPROVED: { status: 422, audience: 'admin' },
  ALLERGEN_TERM_DUPLICATE: { status: 409, audience: 'admin' },
  ALLERGEN_TERM_NOT_FOUND: { status: 404, audience: 'admin' },
  ALLERGEN_TERM_INVALID: { status: 400, audience: 'admin' },
  BOOST_INVALID_PERIOD: { status: 400, audience: 'admin' },
} as const satisfies Record<string, ApiErrorDefinition>;

/**
 * Codes raised by the clients themselves. They never reach the wire and so
 * carry no HTTP status: network failures, Supabase Auth failures and uploads.
 */
export const CLIENT_ERROR_CODES = [
  'NETWORK_OFFLINE',
  'NETWORK_UNAVAILABLE',
  'REQUEST_TIMEOUT',
  'SERVER_UNAVAILABLE',
  'UNKNOWN_ERROR',
  'AUTH_LINK_EXPIRED',
  'AUTH_LINK_INVALID',
  'AUTH_RATE_LIMITED',
  'AUTH_EMAIL_INVALID',
  'AUTH_PROVIDER_FAILED',
  'AUTH_SESSION_EXPIRED',
  'IMAGE_UPLOAD_FAILED',
] as const;

export type ApiErrorCode = keyof typeof API_ERRORS;
export type ClientErrorCode = (typeof CLIENT_ERROR_CODES)[number];

/** One field-level failure reported alongside `VALIDATION_FAILED` (ADR-003). */
export interface ValidationIssue {
  field: string;
  constraint: string;
}

/** The body every API error response carries. `message` is English and technical. */
export interface ApiErrorBody {
  statusCode: number;
  code: ApiErrorCode;
  message: string;
  details?: ValidationIssue[];
}

type CodesFor<A extends string> = {
  [K in ApiErrorCode]: (typeof API_ERRORS)[K]['audience'] extends A | 'shared' ? K : never;
}[ApiErrorCode];

/** Every code the app can have to show copy for. */
export type AppErrorCode = CodesFor<'user'> | ClientErrorCode;

/** Every code the admin panel can have to show copy for; no auth or upload client codes. */
export type AdminErrorCode =
  | CodesFor<'admin'>
  | Exclude<ClientErrorCode, `AUTH_${string}` | 'IMAGE_UPLOAD_FAILED'>;

const API_ERROR_CODES: ReadonlySet<string> = new Set(Object.keys(API_ERRORS));

/** Narrows an unknown value — typically a `code` read off a response body — to a catalog code. */
export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === 'string' && API_ERROR_CODES.has(value);
}
