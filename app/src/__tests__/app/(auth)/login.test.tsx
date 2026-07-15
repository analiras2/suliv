import { render } from '@testing-library/react-native';
import { useState } from 'react';
import { act } from 'react-test-renderer';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/module/auth/view-models/use-login-view-model', () => ({ useLoginViewModel: jest.fn() }));
jest.mock('@/lib/network-status', () => ({ useNetworkStatus: jest.fn() }));

// eslint-disable-next-line import/first
import { useNetworkStatus } from '@/lib/network-status';
// eslint-disable-next-line import/first
import { useLoginViewModel } from '@/module/auth/view-models/use-login-view-model';
// eslint-disable-next-line import/first
import LoginScreen from '@/app/(auth)/login';

const mockUseLoginViewModel = useLoginViewModel as jest.Mock;
const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

function mockViewModel() {
  mockUseLoginViewModel.mockReturnValue({
    email: '',
    error: null,
    setEmail: jest.fn(),
    signInWithOAuth: jest.fn(),
    status: 'idle',
    submitEmail: jest.fn(),
  });
}

describe('LoginScreen offline blocked-state (UT-013, UT-014)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockViewModel();
  });

  it('UT-013: shows the offline message and disables submit controls when disconnected', async () => {
    mockUseNetworkStatus.mockReturnValue({ isConnected: false });
    const rendered = await render(<LoginScreen />);

    expect(rendered.getByTestId('login-offline-message')).toBeTruthy();
    expect(rendered.getByTestId('login-magic-link-button').props.accessibilityState.disabled).toBe(true);
    expect(rendered.getByTestId('login-google-button').props.accessibilityState.disabled).toBe(true);
    expect(rendered.getByTestId('login-apple-button').props.accessibilityState.disabled).toBe(true);
  });

  it('UT-014: re-enables submit controls automatically when the connection is restored', async () => {
    let listener: ((isConnected: boolean) => void) | undefined;
    mockUseNetworkStatus.mockImplementation(() => {
      const [isConnected, setIsConnected] = useState(false);
      listener = setIsConnected;
      return { isConnected };
    });

    const rendered = await render(<LoginScreen />);
    expect(rendered.getByTestId('login-offline-message')).toBeTruthy();
    expect(rendered.getByTestId('login-magic-link-button').props.accessibilityState.disabled).toBe(true);

    await act(async () => {
      listener?.(true);
    });

    expect(rendered.queryByTestId('login-offline-message')).toBeNull();
    expect(rendered.getByTestId('login-magic-link-button').props.accessibilityState.disabled).toBe(false);
    expect(rendered.getByTestId('login-google-button').props.accessibilityState.disabled).toBe(false);
    expect(rendered.getByTestId('login-apple-button').props.accessibilityState.disabled).toBe(false);
  });

  it('does not show the offline message or disable submit controls while connected', async () => {
    mockUseNetworkStatus.mockReturnValue({ isConnected: true });
    const rendered = await render(<LoginScreen />);

    expect(rendered.queryByTestId('login-offline-message')).toBeNull();
    expect(rendered.getByTestId('login-magic-link-button').props.accessibilityState.disabled).toBe(false);
  });
});
