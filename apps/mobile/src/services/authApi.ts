import { getTokens, saveTokens } from "../lib/tokenStorage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SocialProvider = "google" | "apple";

export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserInfo;
  is_new_user?: boolean;
  has_profile?: boolean;
}

export interface OnboardingData {
  dietaryRestrictions?: string[];
  allergens?: string[];
  skillLevel?: "iniciante" | "intermediario" | "avancado";
  availableTime?: number;
  householdSize?: number;
}

export interface ProfileData {
  dietaryRestrictions?: string[];
  allergens?: string[];
  skillLevel?: string;
  availableTime?: number;
  householdSize?: number;
  preferredCuisines?: string[];
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly details: unknown
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

type LogoutListener = () => void;
const logoutListeners: LogoutListener[] = [];

export function onSessionExpired(listener: LogoutListener): () => void {
  logoutListeners.push(listener);
  return () => {
    const idx = logoutListeners.indexOf(listener);
    if (idx !== -1) logoutListeners.splice(idx, 1);
  };
}

function emitSessionExpired(): void {
  logoutListeners.forEach((l) => l());
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

let _baseUrl = "";

export function configureAuthApi(baseUrl: string): void {
  _baseUrl = baseUrl.replace(/\/$/, "");
}

// ---------------------------------------------------------------------------
// Core fetch with silent refresh interceptor
// ---------------------------------------------------------------------------

let _refreshPromise: Promise<AuthResponse> | null = null;

async function fetchWithAuth(
  path: string,
  init: RequestInit,
  retried = false
): Promise<Response> {
  const tokens = await getTokens();
  const headers = new Headers(init.headers);
  if (tokens) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${_baseUrl}${path}`, { ...init, headers });
  } catch {
    throw new NetworkError(`Network request failed: ${path}`);
  }

  if (response.status === 401 && !retried) {
    // Deduplicate concurrent refreshes
    if (!_refreshPromise) {
      _refreshPromise = refreshTokens().finally(() => {
        _refreshPromise = null;
      });
    }

    try {
      await _refreshPromise;
    } catch {
      emitSessionExpired();
      throw new AuthError("Session expired", "session_expired", 401);
    }

    return fetchWithAuth(path, init, true);
  }

  return response;
}

async function handleResponse<T>(response: Response): Promise<T> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new NetworkError("Invalid JSON response");
  }

  if (!response.ok) {
    const err = body as { error?: string; details?: unknown };
    if (response.status === 422) {
      throw new ValidationError(err.error ?? "validation_error", err.details);
    }
    throw new AuthError(
      err.error ?? "request_failed",
      err.error ?? "request_failed",
      response.status
    );
  }

  return body as T;
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export async function register(
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  let response: Response;
  try {
    response = await fetch(`${_baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
  } catch {
    throw new NetworkError("Network request failed: /api/auth/register");
  }

  const data = await handleResponse<AuthResponse>(response);
  await saveTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });
  return data;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  let response: Response;
  try {
    response = await fetch(`${_baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new NetworkError("Network request failed: /api/auth/login");
  }

  const data = await handleResponse<AuthResponse>(response);
  await saveTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });
  return data;
}

export async function socialLogin(
  provider: SocialProvider,
  idToken: string
): Promise<AuthResponse> {
  let response: Response;
  try {
    response = await fetch(`${_baseUrl}/api/auth/social`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, id_token: idToken }),
    });
  } catch {
    throw new NetworkError("Network request failed: /api/auth/social");
  }

  const data = await handleResponse<AuthResponse>(response);
  await saveTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });
  return data;
}

export async function refreshTokens(): Promise<AuthResponse> {
  const tokens = await getTokens();
  if (!tokens) throw new AuthError("No refresh token", "no_refresh_token", 401);

  let response: Response;
  try {
    response = await fetch(`${_baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({ refresh_token: tokens.refreshToken }),
    });
  } catch {
    throw new NetworkError("Network request failed: /api/auth/refresh");
  }

  const data = await handleResponse<AuthResponse>(response);
  await saveTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });
  return data;
}

// ---------------------------------------------------------------------------
// Protected endpoints
// ---------------------------------------------------------------------------

export async function saveOnboarding(data: OnboardingData): Promise<{ profile: ProfileData }> {
  const response = await fetchWithAuth("/api/profile/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<{ profile: ProfileData }>(response);
}

export async function getProfile(): Promise<{ profile: ProfileData }> {
  const response = await fetchWithAuth("/api/profile", { method: "GET" });
  return handleResponse<{ profile: ProfileData }>(response);
}

export async function updateProfile(
  data: Partial<ProfileData>
): Promise<{ profile: ProfileData }> {
  const response = await fetchWithAuth("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<{ profile: ProfileData }>(response);
}
