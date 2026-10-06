import {
  API_ERRORS,
  AdminErrorCode,
  ApiErrorBody,
  ApiErrorCode,
  AppErrorCode,
  ClientErrorCode,
  ValidationIssue,
} from '../src/index';

type Expect<T extends true> = T;
type Extends<A, B> = A extends B ? true : false;

/**
 * Compile-time parity with the TechSpec "Core Interfaces" block. ts-jest fails
 * the suite when any of these stop holding.
 */
type AppKeepsUserAndSharedCodes = Expect<
  Extends<'USERNAME_TAKEN' | 'RECIPE_NOT_FOUND' | 'NETWORK_OFFLINE', AppErrorCode>
>;
type AdminKeepsAdminAndSharedCodes = Expect<
  Extends<'ALLERGEN_TERM_DUPLICATE' | 'RECIPE_NOT_FOUND' | 'REQUEST_TIMEOUT', AdminErrorCode>
>;
type AdminDropsAuthAndUploadCodes = Expect<
  Extends<AdminErrorCode, Exclude<AdminErrorCode, 'AUTH_LINK_EXPIRED' | 'IMAGE_UPLOAD_FAILED'>>
>;

describe('derived code types', () => {
  it('keeps the exported value and type surface in place', () => {
    const apiCode: ApiErrorCode = 'RECIPE_NOT_FOUND';
    const clientCode: ClientErrorCode = 'NETWORK_OFFLINE';
    const issue: ValidationIssue = { field: 'email', constraint: 'isEmail' };
    const body: ApiErrorBody = {
      statusCode: API_ERRORS[apiCode].status,
      code: apiCode,
      message: 'Recipe not found',
      details: [issue],
    };

    const assertions: [
      AppKeepsUserAndSharedCodes,
      AdminKeepsAdminAndSharedCodes,
      AdminDropsAuthAndUploadCodes,
    ] = [true, true, true];

    expect(assertions).toEqual([true, true, true]);
    expect(clientCode).toBe('NETWORK_OFFLINE');
    expect(body.statusCode).toBe(404);
  });
});
