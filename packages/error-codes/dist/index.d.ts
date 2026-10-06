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
export declare const API_ERRORS: {
    readonly VALIDATION_FAILED: {
        readonly status: 400;
        readonly audience: "shared";
    };
    readonly BAD_REQUEST: {
        readonly status: 400;
        readonly audience: "shared";
    };
    readonly UNAUTHORIZED: {
        readonly status: 401;
        readonly audience: "shared";
    };
    readonly FORBIDDEN: {
        readonly status: 403;
        readonly audience: "shared";
    };
    readonly NOT_FOUND: {
        readonly status: 404;
        readonly audience: "shared";
    };
    readonly CONFLICT: {
        readonly status: 409;
        readonly audience: "shared";
    };
    readonly UNPROCESSABLE: {
        readonly status: 422;
        readonly audience: "shared";
    };
    readonly RATE_LIMITED: {
        readonly status: 429;
        readonly audience: "shared";
    };
    readonly INTERNAL_ERROR: {
        readonly status: 500;
        readonly audience: "shared";
    };
    readonly ADMIN_INVALID_CREDENTIALS: {
        readonly status: 401;
        readonly audience: "admin";
    };
    readonly RATING_OUT_OF_RANGE: {
        readonly status: 422;
        readonly audience: "user";
    };
    readonly COMMENT_NOT_FOUND: {
        readonly status: 404;
        readonly audience: "user";
    };
    readonly COMMENT_NOT_OWNED: {
        readonly status: 403;
        readonly audience: "user";
    };
    readonly COMMENT_RATE_LIMITED: {
        readonly status: 429;
        readonly audience: "user";
    };
    readonly USER_NOT_FOUND: {
        readonly status: 404;
        readonly audience: "shared";
    };
    readonly USERNAME_GENERATION_FAILED: {
        readonly status: 409;
        readonly audience: "user";
    };
    readonly USERNAME_TAKEN: {
        readonly status: 409;
        readonly audience: "user";
    };
    readonly USERNAME_CHANGE_TOO_SOON: {
        readonly status: 422;
        readonly audience: "user";
    };
    readonly USERNAME_INVALID: {
        readonly status: 400;
        readonly audience: "user";
    };
    readonly USERNAME_PROHIBITED: {
        readonly status: 400;
        readonly audience: "user";
    };
    readonly RECIPE_NOT_FOUND: {
        readonly status: 404;
        readonly audience: "shared";
    };
    readonly RECIPE_NOT_OWNED: {
        readonly status: 403;
        readonly audience: "user";
    };
    readonly CATEGORY_NOT_FOUND: {
        readonly status: 400;
        readonly audience: "user";
    };
    readonly RECIPE_COVER_REQUIRED: {
        readonly status: 422;
        readonly audience: "user";
    };
    readonly RECIPE_TERMS_NOT_ACCEPTED: {
        readonly status: 422;
        readonly audience: "user";
    };
    readonly RECIPE_SUBMISSION_RATE_LIMITED: {
        readonly status: 429;
        readonly audience: "user";
    };
    readonly SYNC_PAYLOAD_INVALID: {
        readonly status: 400;
        readonly audience: "user";
    };
    readonly REPORT_DUPLICATE: {
        readonly status: 409;
        readonly audience: "user";
    };
    readonly REPORT_TARGET_NOT_FOUND: {
        readonly status: 404;
        readonly audience: "user";
    };
    readonly REPORT_RATE_LIMITED: {
        readonly status: 429;
        readonly audience: "user";
    };
    readonly REPORT_NOT_FOUND: {
        readonly status: 404;
        readonly audience: "admin";
    };
    readonly REPORT_ACTION_NOT_APPLICABLE: {
        readonly status: 400;
        readonly audience: "admin";
    };
    readonly FEATURE_FLAG_NOT_FOUND: {
        readonly status: 404;
        readonly audience: "admin";
    };
    readonly ALLERGEN_NOT_FOUND: {
        readonly status: 404;
        readonly audience: "admin";
    };
    readonly ALLERGEN_NOT_PENDING: {
        readonly status: 409;
        readonly audience: "admin";
    };
    readonly ALLERGEN_NOT_APPROVED: {
        readonly status: 422;
        readonly audience: "admin";
    };
    readonly ALLERGEN_TERM_DUPLICATE: {
        readonly status: 409;
        readonly audience: "admin";
    };
    readonly ALLERGEN_TERM_NOT_FOUND: {
        readonly status: 404;
        readonly audience: "admin";
    };
    readonly ALLERGEN_TERM_INVALID: {
        readonly status: 400;
        readonly audience: "admin";
    };
    readonly BOOST_INVALID_PERIOD: {
        readonly status: 400;
        readonly audience: "admin";
    };
};
/**
 * Codes raised by the clients themselves. They never reach the wire and so
 * carry no HTTP status: network failures, Supabase Auth failures and uploads.
 */
export declare const CLIENT_ERROR_CODES: readonly ["NETWORK_OFFLINE", "NETWORK_UNAVAILABLE", "REQUEST_TIMEOUT", "SERVER_UNAVAILABLE", "UNKNOWN_ERROR", "AUTH_LINK_EXPIRED", "AUTH_LINK_INVALID", "AUTH_RATE_LIMITED", "AUTH_EMAIL_INVALID", "AUTH_PROVIDER_FAILED", "AUTH_SESSION_EXPIRED", "IMAGE_UPLOAD_FAILED"];
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
export type AdminErrorCode = CodesFor<'admin'> | Exclude<ClientErrorCode, `AUTH_${string}` | 'IMAGE_UPLOAD_FAILED'>;
/** Narrows an unknown value — typically a `code` read off a response body — to a catalog code. */
export declare function isApiErrorCode(value: unknown): value is ApiErrorCode;
export {};
