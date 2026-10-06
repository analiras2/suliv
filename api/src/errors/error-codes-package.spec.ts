import { API_ERRORS, ApiErrorBody, isApiErrorCode } from '@suliv/error-codes';

/**
 * IT-002: proves the `file:` dependency on `@suliv/error-codes` resolves and
 * typechecks inside the API build (ADR-002), so every later task can import
 * the catalog instead of restating codes.
 */
describe('@suliv/error-codes in the API', () => {
  it('resolves the shared catalog', () => {
    expect(API_ERRORS.RECIPE_NOT_FOUND).toEqual({
      status: 404,
      audience: 'shared',
    });
    expect(isApiErrorCode('RECIPE_NOT_FOUND')).toBe(true);
  });

  it('types an error response body', () => {
    const body: ApiErrorBody = {
      statusCode: API_ERRORS.USERNAME_TAKEN.status,
      code: 'USERNAME_TAKEN',
      message: 'Username is already taken',
    };

    expect(body.statusCode).toBe(409);
  });
});
