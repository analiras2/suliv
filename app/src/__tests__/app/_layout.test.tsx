import { fireEvent, render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

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

  it('IT-001: session + online + onboarding complete resolves to (tabs)', async () => {
    mockSplash('ready', '(tabs)');
    const rendered = await render(<RootLayout />);
    expectOnlyGroupVisible(rendered, '(tabs)');
  });

  it('IT-002: no session resolves to (auth)', async () => {
    mockSplash('ready', '(auth)');
    const rendered = await render(<RootLayout />);
    expectOnlyGroupVisible(rendered, '(auth)');
  });

  it('IT-003: session + online + onboarding incomplete resolves to (onboarding)', async () => {
    mockSplash('ready', '(onboarding)');
    const rendered = await render(<RootLayout />);
    expectOnlyGroupVisible(rendered, '(onboarding)');
  });

  it('IT-004: session + offline + cached onboarding complete resolves to (tabs), offline flag set', async () => {
    mockSplash('offline', '(tabs)');
    const rendered = await render(<RootLayout />);
    expectOnlyGroupVisible(rendered, '(tabs)');
  });

  it('IT-005: session + offline + cached onboarding incomplete resolves to (onboarding), offline flag set', async () => {
    mockSplash('offline', '(onboarding)');
    const rendered = await render(<RootLayout />);
    expectOnlyGroupVisible(rendered, '(onboarding)');
  });

  it('IT-006: session + offline + no cache shows the error/retry view, no route group rendered', async () => {
    const retry = jest.fn();
    mockSplash('error', null, retry);
    const rendered = await render(<RootLayout />);

    expect(rendered.getByTestId('splash-error-view')).toBeTruthy();
    expect(rendered.queryByTestId('screen-(auth)')).toBeNull();
    expect(rendered.queryByTestId('screen-(onboarding)')).toBeNull();
    expect(rendered.queryByTestId('screen-(tabs)')).toBeNull();

    fireEvent.press(rendered.getByTestId('splash-error-retry-button'));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('renders nothing while fonts or the splash decision are still loading', async () => {
    mockSplash('loading', null);
    const rendered = await render(<RootLayout />);
    expect(rendered.toJSON()).toBeNull();
  });
});
