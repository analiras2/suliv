import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  API_TEST_BASE_URL,
  apiErrorResponse,
  fakeAuthService,
  installFetchMock,
  jsonResponse,
  lastRequest,
  resetFakeAuth,
} from '@/test-utils/api-test-helpers';

jest.mock('@/module/auth/services/auth-service', () => ({
  authService: require('@/test-utils/api-test-helpers').fakeAuthService,
}));

// eslint-disable-next-line import/first
import { termsService } from './terms-service';

describe('termsService', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    resetFakeAuth(null);
    fetchMock = installFetchMock();
  });

  it('reads the current terms without a session or an Authorization header', async () => {
    const terms = { version: 'v1', url: 'https://suliv.test/terms' };
    fetchMock.mockResolvedValue(jsonResponse(terms));

    await expect(termsService.getCurrentTerms()).resolves.toEqual(terms);

    const request = lastRequest(fetchMock);
    expect(request.url).toBe(`${API_TEST_BASE_URL}/terms/current`);
    expect(request.headers).toEqual({});
    expect(fakeAuthService.getSession).not.toHaveBeenCalled();
  });

  it('rejects with the API code when the request fails', async () => {
    fetchMock.mockResolvedValue(apiErrorResponse(500, 'INTERNAL_ERROR'));

    await expect(termsService.getCurrentTerms()).rejects.toMatchObject({ code: 'INTERNAL_ERROR' });
  });
});
