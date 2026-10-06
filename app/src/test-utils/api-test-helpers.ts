import type { Session } from '@supabase/supabase-js';
import { jest } from '@jest/globals';

/**
 * Helpers for service tests that exercise the real `apiRequest` while faking only
 * I/O: `global.fetch` and the auth service that supplies the session token.
 */
export const FAKE_ACCESS_TOKEN = 'access-token';
export const fakeSession = { access_token: FAKE_ACCESS_TOKEN } as Session;
export const API_TEST_BASE_URL = 'http://localhost:3000';
export const BEARER_HEADER = { Authorization: `Bearer ${FAKE_ACCESS_TOKEN}` };

export const fakeAuthService = {
  getSession: jest.fn<() => Promise<Session | null>>(),
  signOut: jest.fn<() => Promise<void>>(),
};

export function resetFakeAuth(session: Session | null = fakeSession): void {
  fakeAuthService.getSession.mockReset().mockResolvedValue(session);
  fakeAuthService.signOut.mockReset().mockResolvedValue(undefined);
}

export function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

/** A failed response whose body is the coded error the API sends. */
export function apiErrorResponse(status: number, code: string, details?: unknown): Response {
  return jsonResponse({ statusCode: status, code, message: 'error', ...(details ? { details } : {}) }, status);
}

export function installFetchMock() {
  const fetchMock = jest.fn<typeof fetch>();
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

export function lastRequest(fetchMock: ReturnType<typeof installFetchMock>, index = 0) {
  const [url, init] = fetchMock.mock.calls[index] as [string, RequestInit];
  return { url, init, headers: (init.headers ?? {}) as Record<string, string>, body: init.body as string | undefined };
}
