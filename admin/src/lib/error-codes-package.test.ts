import { API_ERRORS, AdminErrorCode, isApiErrorCode } from '@suliv/error-codes';

/**
 * IT-002: proves the `file:` dependency on `@suliv/error-codes` resolves and
 * typechecks through Turbopack (ADR-002), so the moderation panel can import
 * the catalog instead of reading English messages.
 */
describe('@suliv/error-codes in the admin panel', () => {
  it('resolves the shared catalog', () => {
    expect(API_ERRORS.ALLERGEN_TERM_DUPLICATE).toEqual({ status: 409, audience: 'admin' });
    expect(isApiErrorCode('ALLERGEN_TERM_DUPLICATE')).toBe(true);
  });

  it('exposes the moderation codes the panel needs', () => {
    const codes: AdminErrorCode[] = [
      'ALLERGEN_TERM_DUPLICATE',
      'RECIPE_NOT_FOUND',
      'REQUEST_TIMEOUT',
    ];

    expect(codes).toHaveLength(3);
  });
});
