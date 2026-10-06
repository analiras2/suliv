import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ApiError } from '@/lib/api-error';
import { ERROR_MESSAGES } from '@/lib/error-messages';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import type { UserProfile } from '@/module/auth/types';

const mockBack = jest.fn();
const mockUpdateUsername = jest.fn<(username: string) => Promise<UserProfile>>();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('@/components/atoms/icon', () => ({ Icon: () => null }));
jest.mock('@/module/profile/services/profile-service', () => ({
  profileService: { updateUsername: (username: string) => mockUpdateUsername(username) },
}));

// eslint-disable-next-line import/first
import { SettingsUsernameScreen } from './settings-username-screen';

describe('SettingsUsernameScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({ user: { id: 'user-1', username: 'ana' } as UserProfile });
  });

  it('E2E-005 shows the Portuguese USERNAME_TAKEN copy next to the form after saving', async () => {
    mockUpdateUsername.mockRejectedValue(new ApiError('USERNAME_TAKEN', 409));
    const screen = await render(<SettingsUsernameScreen />);

    await fireEvent.changeText(screen.getByTestId('settings-username-input'), 'existing_user');
    await fireEvent.press(screen.getByTestId('settings-username-save'));

    await waitFor(() => expect(screen.getByTestId('settings-username-error')).toBeTruthy());
    expect(screen.getByTestId('settings-username-error').props.children).toBe(ERROR_MESSAGES.USERNAME_TAKEN);
    expect(useSessionStore.getState().user?.username).toBe('ana');
  });

  it('goes back after a successful save', async () => {
    mockUpdateUsername.mockResolvedValue({ id: 'user-1', username: 'ana_nova' } as UserProfile);
    const screen = await render(<SettingsUsernameScreen />);

    await fireEvent.changeText(screen.getByTestId('settings-username-input'), 'ana_nova');
    await fireEvent.press(screen.getByTestId('settings-username-save'));

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  });
});
