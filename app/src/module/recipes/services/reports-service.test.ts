import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  API_TEST_BASE_URL,
  apiErrorResponse,
  BEARER_HEADER,
  installFetchMock,
  lastRequest,
  resetFakeAuth,
} from '@/test-utils/api-test-helpers';

jest.mock('@/module/auth/services/auth-service', () => ({
  authService: require('@/test-utils/api-test-helpers').fakeAuthService,
}));

// eslint-disable-next-line import/first
import { reportsService } from './reports-service';

const report = { targetType: 'comment', targetId: 'comment-1', reason: 'spam', freeText: 'repetido' } as const;

describe('reportsService', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    resetFakeAuth();
    fetchMock = installFetchMock();
  });

  it('POSTs the snake_case report body to /reports', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 201 } as Response);

    await expect(reportsService.create(report)).resolves.toBeUndefined();

    const request = lastRequest(fetchMock);
    expect(request.url).toBe(`${API_TEST_BASE_URL}/reports`);
    expect(request.init.method).toBe('POST');
    expect(request.headers).toEqual({ ...BEARER_HEADER, 'Content-Type': 'application/json' });
    expect(request.body).toBe(
      JSON.stringify({ target_type: 'comment', target_id: 'comment-1', reason: 'spam', free_text: 'repetido' }),
    );
  });

  it.each([
    [409, 'REPORT_DUPLICATE'],
    [429, 'REPORT_RATE_LIMITED'],
    [404, 'REPORT_TARGET_NOT_FOUND'],
  ])('rejects a %i response with %s', async (status, code) => {
    fetchMock.mockResolvedValue(apiErrorResponse(status, code));

    await expect(reportsService.create(report)).rejects.toMatchObject({ code, status });
  });
});
