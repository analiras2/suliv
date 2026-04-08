import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  register,
  login,
  socialLogin,
  refreshTokens,
  saveOnboarding,
  getProfile,
  updateProfile,
  configureAuthApi,
  AuthError,
  ValidationError,
  NetworkError,
  onSessionExpired,
} from "../authApi.js";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let storedTokens: { accessToken: string; refreshToken: string } | null = null;

vi.mock("../../lib/tokenStorage.js", () => ({
  saveTokens: vi.fn(async (t: { accessToken: string; refreshToken: string }) => {
    storedTokens = t;
  }),
  getTokens: vi.fn(async () => storedTokens),
  clearTokens: vi.fn(async () => {
    storedTokens = null;
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function okResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  storedTokens = null;
  mockFetch.mockReset();
  configureAuthApi("http://localhost:3000");
});

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------

describe("register", () => {
  it("calls POST /api/auth/register and saves tokens", async () => {
    const payload = {
      access_token: "acc",
      refresh_token: "ref",
      user: { id: "1", email: "a@b.com", name: null },
      is_new_user: true,
    };
    mockFetch.mockResolvedValueOnce(okResponse(payload, 201));

    const result = await register("a@b.com", "password1");

    expect(result.is_new_user).toBe(true);
    expect(storedTokens).toEqual({ accessToken: "acc", refreshToken: "ref" });
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/register",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws ValidationError on 422", async () => {
    mockFetch.mockResolvedValueOnce(
      errorResponse({ error: "validation_error", details: {} }, 422)
    );
    await expect(register("bad", "pw")).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws AuthError on 409 email_taken", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse({ error: "email_taken" }, 409));
    await expect(register("a@b.com", "pass1234")).rejects.toBeInstanceOf(AuthError);
  });

  it("throws NetworkError on fetch failure", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(register("a@b.com", "pass1234")).rejects.toBeInstanceOf(NetworkError);
  });
});

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

describe("login", () => {
  it("calls POST /api/auth/login and saves tokens", async () => {
    const payload = {
      access_token: "acc",
      refresh_token: "ref",
      user: { id: "1", email: "a@b.com", name: null },
      has_profile: false,
    };
    mockFetch.mockResolvedValueOnce(okResponse(payload));

    const result = await login("a@b.com", "password1");

    expect(result.has_profile).toBe(false);
    expect(storedTokens).toEqual({ accessToken: "acc", refreshToken: "ref" });
  });

  it("throws AuthError on 401 invalid_credentials", async () => {
    mockFetch.mockResolvedValueOnce(
      errorResponse({ error: "invalid_credentials" }, 401)
    );
    await expect(login("a@b.com", "wrong")).rejects.toBeInstanceOf(AuthError);
  });
});

// ---------------------------------------------------------------------------
// socialLogin
// ---------------------------------------------------------------------------

describe("socialLogin", () => {
  it("calls POST /api/auth/social with provider and id_token", async () => {
    const payload = {
      access_token: "acc",
      refresh_token: "ref",
      user: { id: "1", email: "g@b.com", name: "Google User" },
      is_new_user: true,
      has_profile: false,
    };
    mockFetch.mockResolvedValueOnce(okResponse(payload));

    await socialLogin("google", "google-id-token");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.provider).toBe("google");
    expect(body.id_token).toBe("google-id-token");
  });

  it("throws AuthError on 401 invalid token", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse({ error: "invalid_token" }, 401));
    await expect(socialLogin("apple", "bad-token")).rejects.toBeInstanceOf(AuthError);
  });
});

// ---------------------------------------------------------------------------
// refreshTokens
// ---------------------------------------------------------------------------

describe("refreshTokens", () => {
  it("throws AuthError when no stored tokens", async () => {
    await expect(refreshTokens()).rejects.toBeInstanceOf(AuthError);
  });

  it("calls POST /api/auth/refresh and updates stored tokens", async () => {
    storedTokens = { accessToken: "old-acc", refreshToken: "old-ref" };
    mockFetch.mockResolvedValueOnce(
      okResponse({
        access_token: "new-acc",
        refresh_token: "new-ref",
        user: { id: "1", email: "a@b.com", name: null },
      })
    );

    await refreshTokens();

    expect(storedTokens).toEqual({ accessToken: "new-acc", refreshToken: "new-ref" });
  });
});

// ---------------------------------------------------------------------------
// Silent refresh interceptor
// ---------------------------------------------------------------------------

describe("silent refresh interceptor", () => {
  it("retries request with new token after 401 + successful refresh", async () => {
    storedTokens = { accessToken: "old-acc", refreshToken: "old-ref" };

    const refreshPayload = {
      access_token: "new-acc",
      refresh_token: "new-ref",
      user: { id: "1", email: "a@b.com", name: null },
    };
    const profilePayload = { profile: { skillLevel: "iniciante" } };

    mockFetch
      .mockResolvedValueOnce(errorResponse({ error: "unauthorized" }, 401)) // initial GET /api/profile
      .mockResolvedValueOnce(okResponse(refreshPayload))                    // POST /api/auth/refresh
      .mockResolvedValueOnce(okResponse(profilePayload));                   // retry GET /api/profile

    const result = await getProfile();

    expect(result.profile).toEqual({ skillLevel: "iniciante" });
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(storedTokens).toEqual({ accessToken: "new-acc", refreshToken: "new-ref" });
  });

  it("emits session-expired event and throws when refresh also fails", async () => {
    storedTokens = { accessToken: "old-acc", refreshToken: "old-ref" };

    const logoutFn = vi.fn();
    const unsub = onSessionExpired(logoutFn);

    mockFetch
      .mockResolvedValueOnce(errorResponse({ error: "unauthorized" }, 401)) // initial
      .mockResolvedValueOnce(errorResponse({ error: "token_revoked" }, 401)); // refresh fails

    await expect(getProfile()).rejects.toBeInstanceOf(AuthError);
    expect(logoutFn).toHaveBeenCalledOnce();

    unsub();
  });
});

// ---------------------------------------------------------------------------
// saveOnboarding / getProfile / updateProfile
// ---------------------------------------------------------------------------

describe("saveOnboarding", () => {
  it("calls POST /api/profile/onboarding with Bearer token", async () => {
    storedTokens = { accessToken: "acc", refreshToken: "ref" };
    mockFetch.mockResolvedValueOnce(okResponse({ profile: {} }));

    await saveOnboarding({ skillLevel: "iniciante" });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer acc");
  });
});

describe("updateProfile", () => {
  it("calls PATCH /api/profile and returns updated profile", async () => {
    storedTokens = { accessToken: "acc", refreshToken: "ref" };
    mockFetch.mockResolvedValueOnce(
      okResponse({ profile: { allergens: ["gluten"] } })
    );

    const result = await updateProfile({ allergens: ["gluten"] });

    expect(result.profile).toEqual({ allergens: ["gluten"] });
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/profile");
    expect(init.method).toBe("PATCH");
  });
});
