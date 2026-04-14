import { create } from "zustand";
import {
  login as apiLogin,
  register as apiRegister,
  socialLogin as apiSocialLogin,
  refreshTokens,
  saveOnboarding as apiSaveOnboarding,
  onSessionExpired,
  type UserInfo,
  type OnboardingData,
  type SocialProvider,
  AuthError,
} from "../../../services/authApi";
import { getTokens, clearTokens } from "../../../lib/tokenStorage";

// ---------------------------------------------------------------------------
// State & actions
// ---------------------------------------------------------------------------

export interface AuthState {
  user: (UserInfo & { hasProfile: boolean }) | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string, name?: string): Promise<void>;
  socialLogin(provider: SocialProvider, idToken: string): Promise<void>;
  logout(): Promise<void>;
  initialize(): Promise<void>;
  saveOnboarding(data: OnboardingData): Promise<void>;
  clearError(): void;
}

export type AuthStore = AuthState & AuthActions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INITIAL_STATE: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

function parseError(err: unknown): string {
  if (err instanceof AuthError) return err.code;
  if (err instanceof Error) return err.message;
  return "unknown_error";
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthStore>((set, get) => {
  // Subscribe to session-expired events from authApi interceptor
  onSessionExpired(() => {
    clearTokens().catch(() => undefined);
    set({ ...INITIAL_STATE });
  });

  return {
    ...INITIAL_STATE,

    // ------------------------------------------------------------------
    // login
    // ------------------------------------------------------------------
    async login(email, password) {
      set({ isLoading: true, error: null });
      try {
        const data = await apiLogin(email, password);
        set({
          user: {
            ...data.user,
            hasProfile: data.has_profile ?? false,
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        set({ isLoading: false, error: parseError(err) });
        throw err;
      }
    },

    // ------------------------------------------------------------------
    // register
    // ------------------------------------------------------------------
    async register(email, password, name) {
      set({ isLoading: true, error: null });
      try {
        const data = await apiRegister(email, password, name);
        set({
          user: {
            ...data.user,
            hasProfile: false,
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        set({ isLoading: false, error: parseError(err) });
        throw err;
      }
    },

    // ------------------------------------------------------------------
    // socialLogin
    // ------------------------------------------------------------------
    async socialLogin(provider, idToken) {
      set({ isLoading: true, error: null });
      try {
        const data = await apiSocialLogin(provider, idToken);
        set({
          user: {
            ...data.user,
            hasProfile: data.has_profile ?? false,
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        set({ isLoading: false, error: parseError(err) });
        throw err;
      }
    },

    // ------------------------------------------------------------------
    // logout
    // ------------------------------------------------------------------
    async logout() {
      set({ isLoading: true });
      // Fire-and-forget server revocation — tokens are cleared locally regardless
      const tokens = await getTokens().catch(() => null);
      if (tokens) {
        const { configureAuthApi } = await import("../../../services/authApi");
        void configureAuthApi; // already configured externally
        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          });
        } catch {
          // Network failure is acceptable — local clear is guaranteed below
        }
      }
      await clearTokens().catch(() => undefined);
      set({ ...INITIAL_STATE });
    },

    // ------------------------------------------------------------------
    // initialize — called once on app mount
    // ------------------------------------------------------------------
    async initialize() {
      set({ isLoading: true, error: null });
      try {
        const stored = await getTokens();
        if (!stored) {
          set({ ...INITIAL_STATE });
          return;
        }

        // Try to get a fresh token pair (refresh if access token is stale)
        const data = await refreshTokens();
        set({
          user: {
            ...data.user,
            hasProfile: data.has_profile ?? false,
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch {
        // Refresh failed → clear state but do NOT propagate the error
        await clearTokens().catch(() => undefined);
        set({ ...INITIAL_STATE });
      }
    },

    // ------------------------------------------------------------------
    // saveOnboarding
    // ------------------------------------------------------------------
    async saveOnboarding(data) {
      set({ isLoading: true, error: null });
      try {
        await apiSaveOnboarding(data);
        const { user } = get();
        if (user) {
          set({ user: { ...user, hasProfile: true }, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      } catch (err) {
        set({ isLoading: false, error: parseError(err) });
        throw err;
      }
    },

    // ------------------------------------------------------------------
    // clearError
    // ------------------------------------------------------------------
    clearError() {
      set({ error: null });
    },
  };
});
