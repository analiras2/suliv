import type { Session } from '@supabase/supabase-js';
import { act, fireEvent, render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useSessionStore } from '@/module/auth/store/use-session-store';
import type { UserProfile } from '@/module/auth/types';
import type { InitialRoute, SplashStatus } from '@/module/splash/viewModels/use-splash-view-model';

jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn() }));
jest.mock('@/design-system/fonts', () => ({ useSulivFonts: jest.fn(() => [true]) }));
jest.mock('@/module/auth/view-models/use-session-view-model', () => ({
  useSessionViewModel: jest.fn(() => ({ status: 'authenticated', error: null })),
}));
jest.mock('@/components/animated-icon', () => ({ AnimatedSplashOverlay: () => null }));
jest.mock('@/module/splash/viewModels/use-splash-view-model', () => ({ useSplashViewModel: jest.fn() }));
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

  function StackScreen({ name }: { name: string }) {
    return ReactLib.createElement(Text, { testID: `screen-${name}` }, name);
  }
  function StackProtected({ guard, children }: { guard: boolean; children: React.ReactNode }) {
    return guard ? ReactLib.createElement(ReactLib.Fragment, null, children) : null;
  }
  function StackComponent({ children }: { children: React.ReactNode }) {
    return ReactLib.createElement(ReactLib.Fragment, null, children);
  }
  StackComponent.Screen = StackScreen;
  StackComponent.Protected = StackProtected;

  return {
    Stack: StackComponent,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
    DefaultTheme: { colors: {} },
  };
});

// eslint-disable-next-line import/first
import { useSplashViewModel } from '@/module/splash/viewModels/use-splash-view-model';
// eslint-disable-next-line import/first
import RootLayout from '@/app/_layout';

const mockUseSplashViewModel = useSplashViewModel as jest.Mock;

function mockSplash(status: SplashStatus, initialRoute: InitialRoute, retry = jest.fn()) {
  mockUseSplashViewModel.mockReturnValue({ status, initialRoute, retry });
}

function profileWith(overrides: Partial<UserProfile>): UserProfile {
  return {
    id: 'user-1',
    email: 'ana@example.com',
    name: 'Ana',
    username: 'ana',
    usernameUpdatedAt: null,
    avatarUrl: null,
    dietPreference: null,
    cookingLevel: null,
    cookingFrequency: null,
    onboardingCompletedAt: null,
    termsVersionAccepted: null,
    termsAcceptedAt: null,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function expectOnlyGroupVisible(
  rendered: Awaited<ReturnType<typeof render>>,
  name: '(auth)' | '(onboarding)' | '(tabs)',
) {
  const groups = ['(auth)', '(onboarding)', '(tabs)'] as const;
  for (const group of groups) {
    const query = rendered.queryByTestId(`screen-${group}`);
    if (group === name) expect(query).toBeTruthy();
    else expect(query).toBeNull();
  }
}

describe('_layout routing decision (IT-001..IT-006)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each<[id: string, description: string, status: SplashStatus, route: '(auth)' | '(onboarding)' | '(tabs)']>([
    ['IT-001', 'session + online + onboarding complete resolves to (tabs)', 'ready', '(tabs)'],
    ['IT-002', 'no session resolves to (auth)', 'ready', '(auth)'],
    ['IT-003', 'session + online + onboarding incomplete resolves to (onboarding)', 'ready', '(onboarding)'],
    ['IT-004', 'session + offline + cached onboarding complete resolves to (tabs), offline flag set', 'offline', '(tabs)'],
    [
      'IT-005',
      'session + offline + cached onboarding incomplete resolves to (onboarding), offline flag set',
      'offline',
      '(onboarding)',
    ],
  ])('%s: %s', async (_id, _description, status, route) => {
    mockSplash(status, route);
    const rendered = await render(<RootLayout />);
    expectOnlyGroupVisible(rendered, route);
  });

  it('IT-006: session + offline + no cache shows the error/retry view, no route group rendered', async () => {
    const retry = jest.fn();
    mockSplash('error', null, retry);
    const rendered = await render(<RootLayout />);

    expect(rendered.getByTestId('state-view-splash_offline')).toBeTruthy();
    expect(rendered.queryByTestId('screen-(auth)')).toBeNull();
    expect(rendered.queryByTestId('screen-(onboarding)')).toBeNull();
    expect(rendered.queryByTestId('screen-(tabs)')).toBeNull();

    fireEvent.press(rendered.getByTestId('state-view-primary-action'));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('renders nothing while fonts or the splash decision are still loading', async () => {
    mockSplash('loading', null);
    const rendered = await render(<RootLayout />);
    expect(rendered.toJSON()).toBeNull();
  });
});

describe('_layout auth guard reacts to live session state', () => {
  it('unmounts (tabs) and mounts (auth) when the session store flips to unauthenticated after sign-out', async () => {
    useSessionStore.setState({ status: 'authenticated', session: {} as Session, user: null });
    mockSplash('ready', '(tabs)');
    const rendered = await render(<RootLayout />);
    expectOnlyGroupVisible(rendered, '(tabs)');

    await act(async () => {
      useSessionStore.getState().setSession(null);
    });

    expectOnlyGroupVisible(rendered, '(auth)');
  });

  it('stays in (auth) when signing in again after a sign-out, while the new profile loads', async () => {
    useSessionStore.setState({ status: 'authenticated', session: {} as Session, user: null });
    mockSplash('ready', '(tabs)');
    const rendered = await render(<RootLayout />);

    await act(async () => {
      useSessionStore.getState().setSession(null);
    });
    await act(async () => {
      useSessionStore.getState().setSession({} as Session);
    });

    // The splash resolved (tabs) for the previous session; it must not apply to this one.
    expectOnlyGroupVisible(rendered, '(auth)');

    await act(async () => {
      useSessionStore.getState().setUser(profileWith({ onboardingCompletedAt: null }));
    });

    expectOnlyGroupVisible(rendered, '(onboarding)');
  });

  it('keeps (auth) mounted while the signed-in profile still has no name', async () => {
    useSessionStore.setState({ status: 'authenticated', session: {} as Session, user: null });
    mockSplash('ready', '(auth)');
    const rendered = await render(<RootLayout />);

    await act(async () => {
      useSessionStore.getState().setUser(profileWith({ name: null }));
    });

    // complete-profile is a screen inside (auth), so the group must not change yet.
    expectOnlyGroupVisible(rendered, '(auth)');
  });

  it('leaves (auth) for (onboarding) once the profile gains a name mid-session', async () => {
    useSessionStore.setState({ status: 'authenticated', session: {} as Session, user: null });
    mockSplash('ready', '(auth)');
    const rendered = await render(<RootLayout />);
    expectOnlyGroupVisible(rendered, '(auth)');

    await act(async () => {
      useSessionStore.getState().setUser(profileWith({ onboardingCompletedAt: null }));
    });

    expectOnlyGroupVisible(rendered, '(onboarding)');
  });

  it('leaves (auth) for (tabs) when the signed-in profile already completed onboarding', async () => {
    useSessionStore.setState({ status: 'authenticated', session: {} as Session, user: null });
    mockSplash('ready', '(auth)');
    const rendered = await render(<RootLayout />);

    await act(async () => {
      useSessionStore
        .getState()
        .setUser(profileWith({ onboardingCompletedAt: '2026-01-01T00:00:00.000Z' }));
    });

    expectOnlyGroupVisible(rendered, '(tabs)');
  });
});
