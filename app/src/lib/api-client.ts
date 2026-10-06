import { ApiError } from '@/lib/api-error';
import { buildApiError } from '@/lib/api-response-error';
import { classifyNetworkFailure } from '@/lib/network-failure';
import { endSessionAfterUnauthorized } from '@/lib/session-expiry';
import { authService } from '@/module/auth/services/auth-service';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const UNAUTHORIZED_STATUS = 401;

export const REQUEST_TIMEOUT_MS = 15_000;

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** `required` (default) needs a session; `optional` sends a token when there is one; `none` never does. */
  auth?: 'required' | 'optional' | 'none';
  signal?: AbortSignal;
  timeoutMs?: number;
}

async function resolveToken(auth: NonNullable<ApiRequestOptions['auth']>): Promise<string | null> {
  if (auth === 'none') return null;
  const session = await authService.getSession();
  if (session) return session.access_token;
  if (auth === 'required') throw new ApiError('UNAUTHORIZED', UNAUTHORIZED_STATUS);
  return null;
}

async function fetchWithTimeout(url: string, init: RequestInit, signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abortFromCaller);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ApiError('REQUEST_TIMEOUT', null));
    }, timeoutMs);
  });

  try {
    return await Promise.race([fetch(url, { ...init, signal: controller.signal }), timeout]);
  } catch (caught: unknown) {
    if (caught instanceof ApiError || signal?.aborted) throw caught;
    throw new ApiError(await classifyNetworkFailure(), null);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

/**
 * The app's only HTTP entry point to the API (ADR-004). It attaches the session
 * token, aborts slow requests, classifies response-less failures after the fact,
 * ends invalid sessions on a tokened 401 (ADR-008) and never retries.
 */
export async function apiRequest(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { method = 'GET', body, auth = 'required', signal, timeoutMs = REQUEST_TIMEOUT_MS } = options;
  const token = await resolveToken(auth);
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
  };

  const response = await fetchWithTimeout(
    `${API_BASE_URL}${path}`,
    { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) },
    signal,
    timeoutMs,
  );
  if (response.ok) return response;

  if (response.status === UNAUTHORIZED_STATUS && token) {
    await endSessionAfterUnauthorized();
  }
  throw await buildApiError(response);
}

export async function apiRequestJson<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  const response = await apiRequest(path, options);
  return (await response.json()) as T;
}
