import { describe, expect, it } from '@jest/globals';
import { API_ERRORS, AppErrorCode, isApiErrorCode } from '@suliv/error-codes';

/**
 * IT-002: proves the `file:` dependency on `@suliv/error-codes` resolves and
 * typechecks through Metro (ADR-002), so the app's error foundation can import
 * the catalog instead of restating codes.
 */
describe('@suliv/error-codes in the app', () => {
  it('resolves the shared catalog', () => {
    expect(API_ERRORS.RECIPE_NOT_FOUND).toEqual({ status: 404, audience: 'shared' });
    expect(isApiErrorCode('RECIPE_NOT_FOUND')).toBe(true);
  });

  it('exposes the user-facing and client codes the app needs', () => {
    const codes: AppErrorCode[] = ['USERNAME_TAKEN', 'RECIPE_NOT_FOUND', 'NETWORK_OFFLINE'];

    expect(codes).toHaveLength(3);
  });
});
