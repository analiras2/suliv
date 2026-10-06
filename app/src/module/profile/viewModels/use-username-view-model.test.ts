import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ApiError } from '@/lib/api-error';
import { ERROR_MESSAGES, VALIDATION_MESSAGES } from '@/lib/error-messages';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import type { UserProfile } from '@/module/auth/types';
import type { ProfileService } from '@/module/profile/services/profile-service';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('@/module/auth/services/auth-service', () => ({ authService: {} }));

// eslint-disable-next-line import/first
import { useUsernameViewModel } from './use-username-view-model';

const user = { id: 'user-1', username: 'ana' } as UserProfile;

describe('useUsernameViewModel', () => {
  let profiles: jest.Mocked<ProfileService>;

  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({ user });
    profiles = {
      updateProfile: jest.fn(),
      updateAllergies: jest.fn(),
      updateUsername: jest.fn<(username: string) => Promise<UserProfile>>(),
    };
  });

  async function submitAs(nextUsername: string) {
    const rendered = await renderHook(() => useUsernameViewModel(profiles));
    await act(() => rendered.result.current.setUsername(nextUsername));
    await act(() => rendered.result.current.submit());
    return rendered;
  }

  it('starts from the current username', async () => {
    const { result } = await renderHook(() => useUsernameViewModel(profiles));

    expect(result.current.username).toBe('ana');
  });

  it('saves the trimmed username, updates the session user and goes back', async () => {
    profiles.updateUsername.mockResolvedValue({ ...user, username: 'ana_nova' });

    await submitAs('  ana_nova ');

    expect(profiles.updateUsername).toHaveBeenCalledWith('ana_nova');
    expect(useSessionStore.getState().user?.username).toBe('ana_nova');
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('goes back without a request when the username did not change', async () => {
    await submitAs('ana');

    expect(profiles.updateUsername).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('E2E-005 shows the USERNAME_TAKEN copy and keeps the previous username', async () => {
    profiles.updateUsername.mockRejectedValue(new ApiError('USERNAME_TAKEN', 409));

    const { result } = await submitAs('existing_user');

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(ERROR_MESSAGES.USERNAME_TAKEN);
    expect(useSessionStore.getState().user?.username).toBe('ana');
    expect(mockBack).not.toHaveBeenCalled();
  });

  it.each([
    ['USERNAME_CHANGE_TOO_SOON', 422],
    ['USERNAME_INVALID', 400],
    ['USERNAME_PROHIBITED', 400],
  ] satisfies [keyof typeof ERROR_MESSAGES, number][])('shows the registry copy for %s', async (code, status) => {
    profiles.updateUsername.mockRejectedValue(new ApiError(code, status));

    const { result } = await submitAs('novo_nome');

    expect(result.current.error).toBe(ERROR_MESSAGES[code]);
  });

  it('exposes field errors from the validation details', async () => {
    profiles.updateUsername.mockRejectedValue(
      new ApiError('VALIDATION_FAILED', 400, [{ field: 'username', constraint: 'isNotEmpty' }]),
    );

    const { result } = await submitAs('x');

    expect(result.current.fieldErrors.username).toBe(VALIDATION_MESSAGES.isNotEmpty);
  });

  it('uses the action wording for an unrecognised failure', async () => {
    profiles.updateUsername.mockRejectedValue(new Error('boom'));

    const { result } = await submitAs('novo_nome');

    expect(result.current.error).toBe('Não foi possível atualizar seu nome de usuário.');
  });
});
