import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// vi.hoisted — declared before any vi.mock factory runs
// ---------------------------------------------------------------------------

const {
  mockLogin,
  mockRegister,
  mockSocialLogin,
  mockRefreshTokens,
  mockSaveOnboarding,
  storedTokensRef,
  sessionExpiredRef,
} = vi.hoisted(() => {
  const storedTokensRef = { value: null as { accessToken: string; refreshToken: string } | null };
  const sessionExpiredRef = { cb: null as (() => void) | null };
  return {
    mockLogin: vi.fn(),
    mockRegister: vi.fn(),
    mockSocialLogin: vi.fn(),
    mockRefreshTokens: vi.fn(),
    mockSaveOnboarding: vi.fn(),
    storedTokensRef,
    sessionExpiredRef,
  };
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("../../../../lib/tokenStorage.js", () => ({
  saveTokens: vi.fn(async (t: { accessToken: string; refreshToken: string }) => {
    storedTokensRef.value = t;
  }),
  getTokens: vi.fn(async () => storedTokensRef.value),
  clearTokens: vi.fn(async () => {
    storedTokensRef.value = null;
  }),
}));

vi.mock("../../../../services/authApi.js", () => ({
  login: mockLogin,
  register: mockRegister,
  socialLogin: mockSocialLogin,
  refreshTokens: mockRefreshTokens,
  saveOnboarding: mockSaveOnboarding,
  configureAuthApi: vi.fn(),
  onSessionExpired: vi.fn((cb: () => void) => {
    sessionExpiredRef.cb = cb;
    return () => undefined;
  }),
  AuthError: class AuthError extends Error {
    constructor(
      message: string,
      public code: string,
      public status: number
    ) {
      super(message);
      this.name = "AuthError";
    }
  },
}));

vi.stubGlobal("fetch", vi.fn());

// ---------------------------------------------------------------------------
// Import store AFTER mocks are registered
// ---------------------------------------------------------------------------

import { useAuthStore } from "../authStore";

function resetStore() {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
}

beforeEach(() => {
  storedTokensRef.value = null;
  // sessionExpiredRef.cb is registered once at store module initialization — do NOT reset it
  vi.clearAllMocks();
  resetStore();
});

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

describe("login", () => {
  it("sets isAuthenticated and user on success", async () => {
    mockLogin.mockResolvedValueOnce({
      access_token: "acc",
      refresh_token: "ref",
      user: { id: "1", email: "a@b.com", name: null },
      has_profile: true,
    });

    await useAuthStore.getState().login("a@b.com", "pass1");

    const { user, isAuthenticated, isLoading, error } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
    expect(user?.email).toBe("a@b.com");
    expect(user?.hasProfile).toBe(true);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it("sets error and rethrows on failure", async () => {
    const { AuthError } = await import("../../../../services/authApi.js");
    mockLogin.mockRejectedValueOnce(new AuthError("bad", "invalid_credentials", 401));

    await expect(useAuthStore.getState().login("a@b.com", "wrong")).rejects.toThrow();

    const { isAuthenticated, error, isLoading } = useAuthStore.getState();
    expect(isAuthenticated).toBe(false);
    expect(error).toBe("invalid_credentials");
    expect(isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------

describe("register", () => {
  it("sets isAuthenticated with hasProfile false after register", async () => {
    mockRegister.mockResolvedValueOnce({
      access_token: "acc",
      refresh_token: "ref",
      user: { id: "2", email: "new@b.com", name: "Ana" },
      is_new_user: true,
    });

    await useAuthStore.getState().register("new@b.com", "pass1234", "Ana");

    const { user, isAuthenticated } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
    expect(user?.hasProfile).toBe(false);
    expect(user?.name).toBe("Ana");
  });
});

// ---------------------------------------------------------------------------
// socialLogin
// ---------------------------------------------------------------------------

describe("socialLogin", () => {
  it("sets user with hasProfile from has_profile flag", async () => {
    mockSocialLogin.mockResolvedValueOnce({
      access_token: "acc",
      refresh_token: "ref",
      user: { id: "3", email: "g@b.com", name: "Google" },
      is_new_user: false,
      has_profile: true,
    });

    await useAuthStore.getState().socialLogin("google", "id-token");

    expect(useAuthStore.getState().user?.hasProfile).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------

describe("logout", () => {
  it("clears state and tokens", async () => {
    storedTokensRef.value = { accessToken: "acc", refreshToken: "ref" };
    useAuthStore.setState({
      user: { id: "1", email: "a@b.com", name: null, hasProfile: true },
      isAuthenticated: true,
    });

    const { clearTokens } = await import("../../../../lib/tokenStorage.js");
    await useAuthStore.getState().logout();

    const { user, isAuthenticated } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isAuthenticated).toBe(false);
    expect(clearTokens).toHaveBeenCalled();
  });

  it("clears state even if server logout request fails", async () => {
    storedTokensRef.value = { accessToken: "acc", refreshToken: "ref" };
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Network error"));

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// initialize
// ---------------------------------------------------------------------------

describe("initialize", () => {
  it("restores session when refresh succeeds", async () => {
    storedTokensRef.value = { accessToken: "old-acc", refreshToken: "old-ref" };
    mockRefreshTokens.mockResolvedValueOnce({
      access_token: "new-acc",
      refresh_token: "new-ref",
      user: { id: "1", email: "a@b.com", name: null },
      has_profile: true,
    });

    await useAuthStore.getState().initialize();

    const { isAuthenticated, user } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
    expect(user?.hasProfile).toBe(true);
  });

  it("clears state when no tokens are stored", async () => {
    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("clears state when refresh fails (expired session)", async () => {
    storedTokensRef.value = { accessToken: "acc", refreshToken: "ref" };
    mockRefreshTokens.mockRejectedValueOnce(new Error("token revoked"));

    await useAuthStore.getState().initialize();

    const { isAuthenticated, isLoading } = useAuthStore.getState();
    expect(isAuthenticated).toBe(false);
    expect(isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// saveOnboarding
// ---------------------------------------------------------------------------

describe("saveOnboarding", () => {
  it("updates hasProfile to true after saving", async () => {
    useAuthStore.setState({
      user: { id: "1", email: "a@b.com", name: null, hasProfile: false },
      isAuthenticated: true,
    });
    mockSaveOnboarding.mockResolvedValueOnce({ profile: {} });

    await useAuthStore.getState().saveOnboarding({ skillLevel: "BEGINNER" });

    expect(useAuthStore.getState().user?.hasProfile).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// onSessionExpired event
// ---------------------------------------------------------------------------

describe("onSessionExpired event", () => {
  it("clears state when the authApi interceptor fires session-expired", async () => {
    useAuthStore.setState({
      user: { id: "1", email: "a@b.com", name: null, hasProfile: true },
      isAuthenticated: true,
    });

    expect(sessionExpiredRef.cb).not.toBeNull();
    sessionExpiredRef.cb!();

    await Promise.resolve();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// clearError
// ---------------------------------------------------------------------------

describe("clearError", () => {
  it("resets error to null", () => {
    useAuthStore.setState({ error: "some_error" });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });
});
