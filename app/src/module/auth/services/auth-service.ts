import {
  createClient,
  type AuthError,
  type Session,
  type SupabaseClient,
} from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

export const AUTH_STORAGE_KEY = 'suliv.auth.session';

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseClient = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storage: secureStoreAdapter,
      storageKey: AUTH_STORAGE_KEY,
    },
  },
);

export type OAuthProvider = 'google' | 'apple';

export interface AuthService {
  signInWithMagicLink(email: string): Promise<void>;
  signInWithOAuth(provider: OAuthProvider): Promise<void>;
  signOut(): Promise<void>;
  getSession(): Promise<Session | null>;
  onAuthStateChange(callback: (session: Session | null) => void): () => void;
}

function throwAuthError(error: AuthError | null): void {
  if (error) {
    throw error;
  }
}

export class SupabaseAuthService implements AuthService {
  private initialUrlHandled = false;

  constructor(private readonly client: SupabaseClient) {}

  async signInWithMagicLink(email: string) {
    const { error } = await this.client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: Linking.createURL('login') },
    });
    throwAuthError(error);
  }

  async signInWithOAuth(provider: OAuthProvider) {
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: Linking.createURL('login') },
    });
    throwAuthError(error);

    if (!data.url) {
      throw new Error('Supabase did not return an OAuth URL.');
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url);
    if (result.type === 'success') {
      await this.completeSignInFromUrl(result.url);
    }
  }

  async signOut() {
    try {
      const { error } = await this.client.auth.signOut({ scope: 'local' });
      throwAuthError(error);
    } finally {
      await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
    }
  }

  async getSession() {
    const { data, error } = await this.client.auth.getSession();
    throwAuthError(error);
    return data.session;
  }

  onAuthStateChange(callback: (session: Session | null) => void) {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      void this.completeSignInFromUrl(url).catch(() => undefined);
    });
    this.handleInitialUrl();
    return () => {
      data.subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }

  /**
   * Linking's 'url' event only fires for links received while the app is already
   * running. A magic-link/OAuth redirect that cold-launches the app instead delivers
   * its URL as the initial URL, which must be read separately or the session from
   * that link is silently dropped. Guarded to run once per app session since
   * multiple view models call onAuthStateChange.
   */
  private handleInitialUrl(): void {
    if (this.initialUrlHandled) return;
    this.initialUrlHandled = true;
    void Linking.getInitialURL().then((url) => {
      if (url) void this.completeSignInFromUrl(url).catch(() => undefined);
    });
  }

  private async completeSignInFromUrl(url: string): Promise<void> {
    const parsedUrl = new URL(url);
    const query = parsedUrl.searchParams;
    const fragment = new URLSearchParams(parsedUrl.hash.slice(1));
    const errorDescription = query.get('error_description') ?? fragment.get('error_description');
    if (errorDescription) {
      throw new Error(errorDescription);
    }

    const code = query.get('code');
    if (code) {
      const { error } = await this.client.auth.exchangeCodeForSession(code);
      throwAuthError(error);
      return;
    }

    const accessToken = query.get('access_token') ?? fragment.get('access_token');
    const refreshToken = query.get('refresh_token') ?? fragment.get('refresh_token');
    if (accessToken && refreshToken) {
      const { error } = await this.client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      throwAuthError(error);
    }
  }
}

export const authService: AuthService = new SupabaseAuthService(supabaseClient);
