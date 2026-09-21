"use strict";
/**
 * Single source of truth for the error codes exchanged between the suliv API
 * and its clients (ADR-001, ADR-002).
 *
 * This package is dependency free and must never import from React Native,
 * NestJS or Next. It holds no user-facing copy: each client owns its own
 * pt-BR registry (ADR-006).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIENT_ERROR_CODES = exports.API_ERRORS = void 0;
exports.isApiErrorCode = isApiErrorCode;
/**
 * The API error catalog. Statuses match the API's current behaviour exactly —
 * adopting a code never changes the HTTP status a caller already sees.
 */
exports.API_ERRORS = {
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
};
/**
 * Codes raised by the clients themselves. They never reach the wire and so
 * carry no HTTP status: network failures, Supabase Auth failures and uploads.
 */
exports.CLIENT_ERROR_CODES = [
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
];
const API_ERROR_CODES = new Set(Object.keys(exports.API_ERRORS));
/** Narrows an unknown value — typically a `code` read off a response body — to a catalog code. */
function isApiErrorCode(value) {
    return typeof value === 'string' && API_ERROR_CODES.has(value);
}
