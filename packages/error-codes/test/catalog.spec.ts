import {
  API_ERRORS,
  CLIENT_ERROR_CODES,
  ErrorAudience,
  isApiErrorCode,
} from '../src/index';

const MIN_ERROR_STATUS = 400;
const MAX_ERROR_STATUS = 599;

/**
 * The exact catalog from the TechSpec "Data Models" table. Kept as a literal so
 * the table and the implementation are compared, not derived from each other.
 */
const EXPECTED_CATALOG: ReadonlyArray<[string, number, ErrorAudience]> = [
  ['VALIDATION_FAILED', 400, 'shared'],
  ['BAD_REQUEST', 400, 'shared'],
  ['UNAUTHORIZED', 401, 'shared'],
  ['FORBIDDEN', 403, 'shared'],
  ['NOT_FOUND', 404, 'shared'],
  ['CONFLICT', 409, 'shared'],
  ['UNPROCESSABLE', 422, 'shared'],
  ['RATE_LIMITED', 429, 'shared'],
  ['INTERNAL_ERROR', 500, 'shared'],
  ['ADMIN_INVALID_CREDENTIALS', 401, 'admin'],
  ['RATING_OUT_OF_RANGE', 422, 'user'],
  ['COMMENT_NOT_FOUND', 404, 'user'],
  ['COMMENT_NOT_OWNED', 403, 'user'],
  ['COMMENT_RATE_LIMITED', 429, 'user'],
  ['USER_NOT_FOUND', 404, 'shared'],
  ['USERNAME_GENERATION_FAILED', 409, 'user'],
  ['USERNAME_TAKEN', 409, 'user'],
  ['USERNAME_CHANGE_TOO_SOON', 422, 'user'],
  ['USERNAME_INVALID', 400, 'user'],
  ['USERNAME_PROHIBITED', 400, 'user'],
  ['RECIPE_NOT_FOUND', 404, 'shared'],
  ['RECIPE_NOT_OWNED', 403, 'user'],
  ['CATEGORY_NOT_FOUND', 400, 'user'],
  ['RECIPE_COVER_REQUIRED', 422, 'user'],
  ['RECIPE_TERMS_NOT_ACCEPTED', 422, 'user'],
  ['RECIPE_SUBMISSION_RATE_LIMITED', 429, 'user'],
  ['SYNC_PAYLOAD_INVALID', 400, 'user'],
  ['REPORT_DUPLICATE', 409, 'user'],
  ['REPORT_TARGET_NOT_FOUND', 404, 'user'],
  ['REPORT_RATE_LIMITED', 429, 'user'],
  ['REPORT_NOT_FOUND', 404, 'admin'],
  ['REPORT_ACTION_NOT_APPLICABLE', 400, 'admin'],
  ['FEATURE_FLAG_NOT_FOUND', 404, 'admin'],
  ['ALLERGEN_NOT_FOUND', 404, 'admin'],
  ['ALLERGEN_NOT_PENDING', 409, 'admin'],
  ['ALLERGEN_NOT_APPROVED', 422, 'admin'],
  ['ALLERGEN_TERM_DUPLICATE', 409, 'admin'],
  ['ALLERGEN_TERM_NOT_FOUND', 404, 'admin'],
  ['ALLERGEN_TERM_INVALID', 400, 'admin'],
  ['BOOST_INVALID_PERIOD', 400, 'admin'],
];

describe('API_ERRORS', () => {
  // UT-001
  it('serves every code with an integer HTTP error status', () => {
    for (const [code, definition] of Object.entries(API_ERRORS)) {
      expect(Number.isInteger(definition.status)).toBe(true);
      expect(definition.status).toBeGreaterThanOrEqual(MIN_ERROR_STATUS);
      expect(definition.status).toBeLessThanOrEqual(MAX_ERROR_STATUS);
      expect(code).toBe(code.toUpperCase());
    }
  });

  // UT-002
  it('shares no code with CLIENT_ERROR_CODES', () => {
    const apiCodes = new Set<string>(Object.keys(API_ERRORS));
    const overlap = CLIENT_ERROR_CODES.filter((code) => apiCodes.has(code));

    expect(overlap).toEqual([]);
  });

  // UT-003
  it('contains exactly the catalog from the TechSpec Data Models table', () => {
    expect(Object.keys(API_ERRORS)).toHaveLength(EXPECTED_CATALOG.length);
  });

  // UT-003 (table-driven)
  it.each(EXPECTED_CATALOG)('serves %s as %i for the %s audience', (code, status, audience) => {
    expect(API_ERRORS[code as keyof typeof API_ERRORS]).toEqual({ status, audience });
  });
});

describe('isApiErrorCode', () => {
  // UT-004
  it('accepts a catalog code', () => {
    expect(isApiErrorCode('RECIPE_NOT_FOUND')).toBe(true);
  });

  // UT-005
  it.each([['NOT_A_CODE'], [undefined], [404]])('rejects %p', (value) => {
    expect(isApiErrorCode(value)).toBe(false);
  });
});
