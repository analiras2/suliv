import { API_ERRORS, CLIENT_ERROR_CODES } from '@suliv/error-codes';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { analyticsClient } from '@/lib/analytics';
import { ApiError } from '@/lib/api-error';
import {
  ERROR_MESSAGES,
  GENERIC_ERROR_MESSAGE,
  getErrorMessage,
  getFieldErrors,
  VALIDATION_MESSAGES,
} from '@/lib/error-messages';
import { resetUnmappedErrorReports } from '@/lib/error-report';

const HTTP_CONFLICT = 409;
const HTTP_BAD_REQUEST = 400;
const REPEATED_RESOLUTIONS = 5;

describe('error messages', () => {
  const track = jest.spyOn(analyticsClient, 'track');

  beforeEach(() => {
    track.mockClear();
    resetUnmappedErrorReports();
  });

  it('UT-037 has copy for every code the app can receive', () => {
    const appCodes = [
      ...(Object.keys(API_ERRORS) as (keyof typeof API_ERRORS)[]).filter(
        (code) => API_ERRORS[code].audience !== 'admin',
      ),
      ...CLIENT_ERROR_CODES,
    ];

    expect(Object.keys(ERROR_MESSAGES).sort()).toEqual([...appCodes].sort());
    for (const code of appCodes) {
      expect(ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES].length).toBeGreaterThan(0);
    }
  });

  it('UT-038 returns the registry copy for an ApiError code', () => {
    expect(getErrorMessage(new ApiError('USERNAME_TAKEN', HTTP_CONFLICT))).toBe(ERROR_MESSAGES.USERNAME_TAKEN);
  });

  it('UT-039 never leaks the message of a plain Error', () => {
    expect(getErrorMessage(new Error('Network request failed'))).toBe(GENERIC_ERROR_MESSAGE);
  });

  it('UT-040 returns the given fallback when the error is not an ApiError', () => {
    const fallback = 'Não foi possível enviar o link mágico.';

    expect(getErrorMessage('offline', fallback)).toBe(fallback);
  });

  it('UT-041 maps validation details to one message per field', () => {
    const error = new ApiError('VALIDATION_FAILED', HTTP_BAD_REQUEST, [{ field: 'name', constraint: 'isNotEmpty' }]);

    expect(getFieldErrors(error)).toEqual({ name: VALIDATION_MESSAGES.isNotEmpty });
  });

  it('UT-042 falls back to a generic field message for an unmapped constraint', () => {
    const error = new ApiError('VALIDATION_FAILED', HTTP_BAD_REQUEST, [
      { field: 'field', constraint: 'isSomethingNew' },
    ]);

    expect(getFieldErrors(error)).toEqual({ field: 'Confira este campo.' });
  });

  it('UT-043 returns no field errors for an error that is not a validation failure', () => {
    expect(getFieldErrors(new ApiError('RECIPE_NOT_FOUND', 404))).toEqual({});
  });

  describe('error_unmapped reporting', () => {
    it('UT-044 reports an unrecognised API code with its status', () => {
      getErrorMessage(new ApiError('UNKNOWN_ERROR', HTTP_CONFLICT, [], 'SOMETHING_NEW'));

      expect(track).toHaveBeenCalledWith('error_unmapped', {
        code: 'SOMETHING_NEW',
        status: HTTP_CONFLICT,
        source: 'api',
      });
    });

    it('reports an unmapped validation constraint with the validation source', () => {
      getFieldErrors(
        new ApiError('VALIDATION_FAILED', HTTP_BAD_REQUEST, [{ field: 'x', constraint: 'isSomethingNew' }]),
      );

      expect(track).toHaveBeenCalledWith('error_unmapped', {
        code: 'isSomethingNew',
        status: HTTP_BAD_REQUEST,
        source: 'validation',
      });
    });

    it('UT-045 reports the same code and source once per session', () => {
      for (let attempt = 0; attempt < REPEATED_RESOLUTIONS; attempt += 1) {
        getErrorMessage(new ApiError('UNKNOWN_ERROR', HTTP_CONFLICT, [], 'SOMETHING_NEW'));
      }

      expect(track).toHaveBeenCalledTimes(1);
    });

    it('UT-046 reports nothing for a mapped code', () => {
      getErrorMessage(new ApiError('USERNAME_TAKEN', HTTP_CONFLICT));

      expect(track).not.toHaveBeenCalled();
    });
  });
});
