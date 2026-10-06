import type { Session } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useSessionStore } from '@/module/auth/store/use-session-store';

const mockGetSession = jest.fn<() => Promise<Session | null>>();
const mockSignOut = jest.fn<() => Promise<void>>();
const mockNetInfoFetch = jest.fn<() => Promise<{ isConnected: boolean | null }>>();
const mockFetch = jest.fn<typeof fetch>();

jest.mock('@/module/auth/services/auth-service', () => ({
  authService: {
    getSession: () => mockGetSession(),
    signOut: () => mockSignOut(),
  },
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: () => mockNetInfoFetch() },
}));

/* eslint-disable import/first */
import { ApiError } from '@/lib/api-error';
import { apiRequest, apiRequestJson, REQUEST_TIMEOUT_MS } from '@/lib/api-client';
/* eslint-enable import/first */

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const session = { access_token: 'token-1' } as Session;
const HTTP_UNAUTHORIZED = 401;

function answer(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (body === undefined) throw new SyntaxError('Unexpected end of JSON input');
      return body;
    },
  } as unknown as Response;
}

describe('apiRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
    mockGetSession.mockResolvedValue(session);
    mockSignOut.mockResolvedValue(undefined);
    mockNetInfoFetch.mockResolvedValue({ isConnected: true });
    useSessionStore.setState({ session, status: 'authenticated', authNotice: null });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('requests and parsing', () => {
    it('UT-021 sends the bearer token to the API base URL and parses the JSON', async () => {
      mockFetch.mockResolvedValue(answer(200, { items: [] }));

      await expect(apiRequestJson('/feed', { auth: 'required' })).resolves.toEqual({ items: [] });

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/feed`,
        expect.objectContaining({ method: 'GET', headers: { Authorization: 'Bearer token-1' } }),
      );
    });

    it('UT-022 resolves a 204 without parsing a body', async () => {
      const noContent = answer(204);
      const parse = jest.spyOn(noContent, 'json');
      mockFetch.mockResolvedValue(noContent);

      await expect(apiRequest('/favorites/r1', { method: 'DELETE' })).resolves.toBe(noContent);
      expect(parse).not.toHaveBeenCalled();
    });

    it('UT-023 sends no Authorization header for optional auth without a session', async () => {
      mockGetSession.mockResolvedValue(null);
      mockFetch.mockResolvedValue(answer(200, {}));

      await apiRequest('/recipes/x', { auth: 'optional' });

      const init = mockFetch.mock.calls[0][1] as RequestInit;
      expect(init.headers).not.toHaveProperty('Authorization');
    });

    it('serializes the body as JSON with a content type', async () => {
      mockFetch.mockResolvedValue(answer(200, {}));

      await apiRequest('/me', { method: 'PATCH', body: { name: 'Ana' } });

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/me`,
        expect.objectContaining({
          body: JSON.stringify({ name: 'Ana' }),
          headers: { Authorization: 'Bearer token-1', 'Content-Type': 'application/json' },
        }),
      );
    });

    it('UT-024 rejects with UNAUTHORIZED without calling fetch when a required session is missing', async () => {
      mockGetSession.mockResolvedValue(null);

      await expect(apiRequest('/me', { auth: 'required' })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        status: HTTP_UNAUTHORIZED,
      });
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('UT-025 keeps a known API code and its status', async () => {
      mockFetch.mockResolvedValue(answer(409, { code: 'USERNAME_TAKEN' }));

      await expect(apiRequest('/me')).rejects.toMatchObject({ code: 'USERNAME_TAKEN', status: 409 });
    });

    it('keeps validation details from a VALIDATION_FAILED body', async () => {
      const details = [{ field: 'name', constraint: 'isNotEmpty' }];
      mockFetch.mockResolvedValue(answer(400, { code: 'VALIDATION_FAILED', details }));

      await expect(apiRequest('/me')).rejects.toMatchObject({ code: 'VALIDATION_FAILED', details });
    });

    it('UT-026 turns an unknown code into UNKNOWN_ERROR keeping the raw code', async () => {
      mockFetch.mockResolvedValue(answer(409, { code: 'SOMETHING_NEW' }));

      await expect(apiRequest('/me')).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
        status: 409,
        rawCode: 'SOMETHING_NEW',
      });
    });

    it('treats an admin-only code as unknown to the app', async () => {
      mockFetch.mockResolvedValue(answer(409, { code: 'ALLERGEN_TERM_DUPLICATE' }));

      await expect(apiRequest('/me')).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
        rawCode: 'ALLERGEN_TERM_DUPLICATE',
      });
    });

    it('UT-027 turns a non-JSON 4xx body into UNKNOWN_ERROR', async () => {
      mockFetch.mockResolvedValue(answer(400));

      await expect(apiRequest('/me')).rejects.toMatchObject({ code: 'UNKNOWN_ERROR', status: 400 });
    });
  });

  describe('network and timeout', () => {
    it('UT-028 turns a 5xx without a JSON body into SERVER_UNAVAILABLE', async () => {
      mockFetch.mockResolvedValue(answer(503));

      await expect(apiRequest('/feed')).rejects.toMatchObject({ code: 'SERVER_UNAVAILABLE', status: 503 });
    });

    it('UT-029 reports NETWORK_OFFLINE when there is no response and no connectivity', async () => {
      mockFetch.mockRejectedValue(new TypeError('Network request failed'));
      mockNetInfoFetch.mockResolvedValue({ isConnected: false });

      await expect(apiRequest('/feed')).rejects.toMatchObject({ code: 'NETWORK_OFFLINE', status: null });
    });

    it('UT-030 reports NETWORK_UNAVAILABLE when there is no response but connectivity', async () => {
      mockFetch.mockRejectedValue(new TypeError('Network request failed'));

      await expect(apiRequest('/feed')).rejects.toMatchObject({ code: 'NETWORK_UNAVAILABLE' });
    });

    it('UT-031 times out at REQUEST_TIMEOUT_MS and not before', async () => {
      jest.useFakeTimers();
      mockFetch.mockReturnValue(new Promise(() => undefined));
      const outcome = apiRequest('/feed').then(
        () => 'resolved',
        (caught: unknown) => caught,
      );
      await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS - 1);
      const pending = await Promise.race([outcome, Promise.resolve('pending')]);

      await jest.advanceTimersByTimeAsync(1);

      expect(pending).toBe('pending');
      await expect(outcome).resolves.toMatchObject({ code: 'REQUEST_TIMEOUT' });
    });

    it('rethrows the caller abort instead of reporting a network failure', async () => {
      const controller = new AbortController();
      const abortError = new DOMException('Aborted', 'AbortError');
      mockFetch.mockImplementation(async () => {
        controller.abort();
        throw abortError;
      });

      await expect(apiRequest('/feed', { signal: controller.signal })).rejects.toBe(abortError);
      expect(mockNetInfoFetch).not.toHaveBeenCalled();
    });

    it('UT-032 reads connectivity only after a response-less failure', async () => {
      mockFetch.mockResolvedValue(answer(200, {}));
      await apiRequest('/feed');
      expect(mockNetInfoFetch).not.toHaveBeenCalled();

      mockFetch.mockRejectedValue(new TypeError('Network request failed'));
      await apiRequest('/feed').catch(() => undefined);
      expect(mockNetInfoFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('central 401 handling', () => {
    it('UT-033 ends the session once and rejects with UNAUTHORIZED', async () => {
      mockFetch.mockResolvedValue(answer(HTTP_UNAUTHORIZED, { code: 'UNAUTHORIZED' }));

      await expect(apiRequest('/feed')).rejects.toBeInstanceOf(ApiError);

      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(useSessionStore.getState().authNotice).toBe('AUTH_SESSION_EXPIRED');
      expect(useSessionStore.getState().session).toBeNull();
    });

    it('UT-034 runs the sequence exactly once for concurrent 401s', async () => {
      mockFetch.mockImplementation(async () => answer(HTTP_UNAUTHORIZED, { code: 'UNAUTHORIZED' }));

      const outcomes = await Promise.allSettled([apiRequest('/a'), apiRequest('/b'), apiRequest('/c')]);

      expect(outcomes.every((outcome) => outcome.status === 'rejected')).toBe(true);
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('UT-035 leaves the session alone for a 401 without a token', async () => {
      mockGetSession.mockResolvedValue(null);
      mockFetch.mockResolvedValue(answer(HTTP_UNAUTHORIZED, { code: 'UNAUTHORIZED' }));

      await expect(apiRequest('/recipes/x', { auth: 'optional' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

      expect(mockSignOut).not.toHaveBeenCalled();
      expect(useSessionStore.getState().session).toBe(session);
    });

    it('UT-036 still clears the session and rejects when sign-out fails', async () => {
      mockSignOut.mockRejectedValue(new Error('storage failure'));
      mockFetch.mockResolvedValue(answer(HTTP_UNAUTHORIZED, { code: 'UNAUTHORIZED' }));

      await expect(apiRequest('/feed')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

      expect(useSessionStore.getState().session).toBeNull();
    });
  });
});
