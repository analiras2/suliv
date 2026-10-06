import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { UserProfile } from '@/module/auth/types';
import {
  API_TEST_BASE_URL,
  apiErrorResponse,
  BEARER_HEADER,
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
import { profileService } from './profile-service';

const user = { id: 'user-1', name: 'Ana' } as UserProfile;

describe('ProfileService', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    resetFakeAuth();
    fetchMock = installFetchMock();
  });

  it('bootstraps the profile with the session bearer token', async () => {
    const response = { missingName: false, user };
    fetchMock.mockResolvedValue(jsonResponse(response));

    await expect(profileService.bootstrap()).resolves.toEqual(response);

    const request = lastRequest(fetchMock);
    expect(request.url).toBe(`${API_TEST_BASE_URL}/me/bootstrap`);
    expect(request.init.method).toBe('POST');
    expect(request.headers).toEqual({ ...BEARER_HEADER, 'Content-Type': 'application/json' });
    expect(request.body).toBe('{}');
  });

  it('patches the supplied profile name', async () => {
    fetchMock.mockResolvedValue(jsonResponse(user));

    await expect(profileService.updateName('Ana')).resolves.toBe(user);

    const request = lastRequest(fetchMock);
    expect(request.url).toBe(`${API_TEST_BASE_URL}/me`);
    expect(request.init.method).toBe('PATCH');
    expect(request.body).toBe(JSON.stringify({ name: 'Ana' }));
  });

  it('fetches the current profile', async () => {
    fetchMock.mockResolvedValue(jsonResponse(user));

    await expect(profileService.getMe()).resolves.toBe(user);

    const request = lastRequest(fetchMock);
    expect(request.url).toBe(`${API_TEST_BASE_URL}/me`);
    expect(request.init.method).toBe('GET');
    expect(request.headers).toEqual(BEARER_HEADER);
  });

  it('honours the supplied abort signal', async () => {
    const controller = new AbortController();
    const abortError = new DOMException('Aborted', 'AbortError');
    fetchMock.mockImplementation(async () => {
      controller.abort();
      throw abortError;
    });

    await expect(profileService.getMe(controller.signal)).rejects.toBe(abortError);
  });

  it('deletes the current profile without parsing the empty response', async () => {
    const accepted = { ok: true, status: 202 } as Response;
    fetchMock.mockResolvedValue(accepted);

    await expect(profileService.deleteMe()).resolves.toBeUndefined();

    expect(lastRequest(fetchMock).init.method).toBe('DELETE');
  });

  it('rejects a coded API failure with its code', async () => {
    fetchMock.mockResolvedValue(apiErrorResponse(404, 'USER_NOT_FOUND'));

    await expect(profileService.bootstrap()).rejects.toMatchObject({ code: 'USER_NOT_FOUND', status: 404 });
  });

  it('requires a session before calling the API', async () => {
    resetFakeAuth(null);

    await expect(profileService.getMe()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fakeAuthService.signOut).not.toHaveBeenCalled();
  });
});
