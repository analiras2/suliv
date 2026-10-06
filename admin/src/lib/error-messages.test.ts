import { API_ERRORS, CLIENT_ERROR_CODES } from '@suliv/error-codes';
import { ApiError } from './api-error';
import {
  ERROR_MESSAGES,
  GENERIC_ERROR_MESSAGE,
  getErrorMessage,
  getFieldErrors,
  resetUnmappedErrorReports,
  VALIDATION_MESSAGES,
} from './error-messages';

const HTTP_CONFLICT = 409;
const HTTP_BAD_REQUEST = 400;
const REPEATED_RESOLUTIONS = 5;

describe('admin error messages', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    resetUnmappedErrorReports();
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('UT-066 has copy for every code the panel can receive', () => {
    const adminCodes = [
      ...(Object.keys(API_ERRORS) as (keyof typeof API_ERRORS)[]).filter(
        (code) => API_ERRORS[code].audience !== 'user',
      ),
      ...CLIENT_ERROR_CODES.filter((code) => !code.startsWith('AUTH_') && code !== 'IMAGE_UPLOAD_FAILED'),
    ];

    expect(Object.keys(ERROR_MESSAGES).sort()).toEqual([...adminCodes].sort());
    for (const message of Object.values(ERROR_MESSAGES)) {
      expect(message.length).toBeGreaterThan(0);
    }
  });

  it('returns the registry copy for a known code', () => {
    expect(getErrorMessage(new ApiError('ALLERGEN_TERM_DUPLICATE', HTTP_CONFLICT))).toBe(
      ERROR_MESSAGES.ALLERGEN_TERM_DUPLICATE,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('UT-067 returns the generic copy for an unknown code and warns once with code, status and source only', () => {
    const unknown = new ApiError('UNKNOWN_ERROR', HTTP_CONFLICT, [], 'SOMETHING_NEW');

    for (let attempt = 0; attempt < REPEATED_RESOLUTIONS; attempt += 1) {
      expect(getErrorMessage(unknown)).toBe(GENERIC_ERROR_MESSAGE);
    }

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith('error_unmapped', { code: 'SOMETHING_NEW', status: HTTP_CONFLICT, source: 'api' });
  });

  it('never returns the message of a plain Error', () => {
    expect(getErrorMessage(new Error('Failed to fetch'))).toBe(GENERIC_ERROR_MESSAGE);
  });

  it('maps validation details to one message per field and reports an unmapped constraint', () => {
    const error = new ApiError('VALIDATION_FAILED', HTTP_BAD_REQUEST, [
      { field: 'email', constraint: 'isEmail' },
      { field: 'password', constraint: 'isSomethingNew' },
    ]);

    expect(getFieldErrors(error)).toEqual({
      email: VALIDATION_MESSAGES.isEmail,
      password: 'Confira este campo.',
    });
    expect(warn).toHaveBeenCalledWith('error_unmapped', {
      code: 'isSomethingNew',
      status: HTTP_BAD_REQUEST,
      source: 'validation',
    });
  });

  it('returns no field errors for an error that is not a validation failure', () => {
    expect(getFieldErrors(new ApiError('RECIPE_NOT_FOUND', 404))).toEqual({});
  });
});
