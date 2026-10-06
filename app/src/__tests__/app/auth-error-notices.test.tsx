/* eslint-disable @typescript-eslint/no-require-imports */
import type { Session } from '@supabase/supabase-js';
import { act, render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockGetSession = jest.fn<() => Promise<{ data: { session: Session | null }; error: null }>>();
const mockSignOut = jest.fn<() => Promise<{ error: null }>>();
const mockFetch = jest.fn<typeof fetch>();
const mockGetInitialUrl = jest.fn<() => Promise<string | null>>();

// Supabase is the only auth fake: the real auth service, API client, session store and screens are wired together.
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getSession: () => mockGetSession(),
      signOut: () => mockSignOut(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    },
  }),
}));
jest.mock('expo-secure-store', () => ({
  deleteItemAsync: async () => undefined,
  getItemAsync: async () => null,
  setItemAsync: async () => undefined,
}));
jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: async () => ({ type: 'cancel' }) }));
jest.mock('expo-linking', () => ({
  addEventListener: () => ({ remove: () => undefined }),
  createURL: (path: string) => `suliv://${path}`,
  getInitialURL: () => mockGetInitialUrl(),
}));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: () => undefined }));
jest.mock('@/design-system/fonts', () => ({ useSulivFonts: () => [true] }));
jest.mock('@/lib/network-status', () => ({ useNetworkStatus: () => ({ isConnected: true }) }));
jest.mock('@/components/animated-icon', () => ({ AnimatedSplashOverlay: () => null }));
jest.mock('@/module/auth/view-models/use-session-view-model', () => ({
  useSessionViewModel: () => ({ status: 'authenticated', error: null }),
}));
jest.mock('@/module/splash/viewModels/use-splash-view-model', () => ({
  useSplashViewModel: () => ({ status: 'ready', initialRoute: '(tabs)', retry: () => undefined }),
}));
jest.mock('react-native-safe-area-context', () => {
  const ReactLib = require('react');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) =>
      ReactLib.createElement('SafeAreaView', props, children),
  };
});
jest.mock('expo-router', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  const Screen = ({ name }: { name: string }) => ReactLib.createElement(Text, { testID: `screen-${name}` }, name);
  const Protected = ({ guard, children }: { guard: boolean; children: React.ReactNode }) =>
    guard ? ReactLib.createElement(ReactLib.Fragment, null, children) : null;
  const Stack = ({ children }: { children: React.ReactNode }) => ReactLib.createElement(ReactLib.Fragment, null, children);
  Stack.Screen = Screen;
  Stack.Protected = Protected;
  return {
    Stack,
    DefaultTheme: { colors: {} },
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
    useRouter: () => ({ replace: () => undefined }),
  };
});

/* eslint-disable import/first */
import LoginScreen from '@/app/(auth)/login';
import RootLayout from '@/app/_layout';
import { apiRequest } from '@/lib/api-client';
import { ERROR_MESSAGES } from '@/lib/error-messages';
import { useSessionStore } from '@/module/auth/store/use-session-store';
/* eslint-enable import/first */

const session = { access_token: 'token-1' } as Session;
const HTTP_UNAUTHORIZED = 401;

describe('auth notices reach the login screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
    mockGetSession.mockResolvedValue({ data: { session }, error: null });
    mockSignOut.mockResolvedValue({ error: null });
    mockGetInitialUrl.mockResolvedValue(null);
    useSessionStore.setState({ session, status: 'authenticated', user: null, authNotice: null });
  });

  // Order matters: the real auth service reads the opening URL once per app session, so the
  // test that depends on it must run before any other test mounts the login screen.
  it('IT-021 an expired magic link in the opening URL shows the expired-link copy and keeps sending enabled', async () => {
    useSessionStore.setState({ session: null, status: 'unauthenticated', authNotice: null });
    mockGetInitialUrl.mockResolvedValue('suliv://login#error=access_denied&error_code=otp_expired');

    const login = await render(<LoginScreen />);
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });

    expect(login.getByText(ERROR_MESSAGES.AUTH_LINK_EXPIRED)).toBeTruthy();
    expect(login.getByTestId('login-magic-link-button').props.accessibilityState.disabled).toBeFalsy();
  });

  it('IT-020 a 401 on a tokened request routes to login with the session-expired copy', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: HTTP_UNAUTHORIZED,
      json: async () => ({ code: 'UNAUTHORIZED' }),
    } as Response);
    const layout = await render(<RootLayout />);
    expect(layout.queryByTestId('screen-(tabs)')).toBeTruthy();

    await act(async () => {
      await apiRequest('/feed').catch(() => undefined);
    });

    expect(layout.queryByTestId('screen-(tabs)')).toBeNull();
    expect(layout.queryByTestId('screen-(auth)')).toBeTruthy();
    const login = await render(<LoginScreen />);
    expect(login.getByText(ERROR_MESSAGES.AUTH_SESSION_EXPIRED)).toBeTruthy();
  });
});
