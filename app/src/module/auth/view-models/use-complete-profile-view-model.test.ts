import type { Session } from '@supabase/supabase-js';
import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ApiError } from '@/lib/api-error';
import { AUTH_MESSAGES, ERROR_MESSAGES, VALIDATION_MESSAGES } from '@/lib/error-messages';
import type { ProfileService } from '@/module/auth/services/profile-service';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import type { UserProfile } from '@/module/auth/types';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

// eslint-disable-next-line import/first
import { useCompleteProfileViewModel } from './use-complete-profile-view-model';

const session = { access_token: 'access-token' } as Session;
const user = { id: 'user-1', name: 'Ana' } as UserProfile;

describe('useCompleteProfileViewModel', () => {
  let profiles: jest.Mocked<ProfileService>;

  beforeEach(() => {
    jest.clearAllMocks();
    profiles = {
      bootstrap: jest.fn<() => Promise<never>>(),
      deleteMe: jest.fn(),
      getMe: jest.fn(),
      updateName: jest.fn<(name: string) => Promise<UserProfile>>()
        .mockResolvedValue(user),
    };
    useSessionStore.setState({ session, status: 'authenticated', user: null });
  });

  it('updates the missing name and routes home', async () => {
    const { result } = await renderHook(() => useCompleteProfileViewModel(profiles));
    await act(() => result.current.setName('  Ana  '));
    await act(() => result.current.submitName());
    expect(profiles.updateName).toHaveBeenCalledWith('Ana');
    expect(useSessionStore.getState().user).toBe(user);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('routes a named profile that has not finished onboarding to the onboarding group', async () => {
    profiles.updateName.mockResolvedValue({ ...user, onboardingCompletedAt: null });
    const { result } = await renderHook(() => useCompleteProfileViewModel(profiles));
    await act(() => result.current.setName('Ana'));
    await act(() => result.current.submitName());
    expect(mockReplace).toHaveBeenCalledWith('/(onboarding)');
  });

  it('requires a name and an active session', async () => {
    const { result } = await renderHook(() => useCompleteProfileViewModel(profiles));
    await act(() => result.current.submitName());
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(AUTH_MESSAGES.missingName);

    await act(() => result.current.setName('Ana'));
    useSessionStore.setState({ session: null, status: 'unauthenticated' });
    await act(() => result.current.submitName());
    expect(profiles.updateName).not.toHaveBeenCalled();
  });

  it('exposes profile update failures', async () => {
    profiles.updateName.mockRejectedValue(new ApiError('USERNAME_TAKEN', 409));
    const { result } = await renderHook(() => useCompleteProfileViewModel(profiles));
    await act(() => result.current.setName('Ana'));
    await act(() => result.current.submitName());
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(ERROR_MESSAGES.USERNAME_TAKEN);
  });

  it('UT-060 exposes field errors from the validation details', async () => {
    profiles.updateName.mockRejectedValue(
      new ApiError('VALIDATION_FAILED', 400, [{ field: 'name', constraint: 'isNotEmpty' }]),
    );
    const { result } = await renderHook(() => useCompleteProfileViewModel(profiles));
    await act(() => result.current.setName('Ana'));
    await act(() => result.current.submitName());
    expect(result.current.fieldErrors.name).toBe(VALIDATION_MESSAGES.isNotEmpty);
  });

  it('uses a safe message for non-Error update failures', async () => {
    profiles.updateName.mockRejectedValue('offline');
    const { result } = await renderHook(() => useCompleteProfileViewModel(profiles));
    await act(() => result.current.setName('Ana'));
    await act(() => result.current.submitName());
    expect(result.current.error).toBe(AUTH_MESSAGES.updateProfileFailed);
  });
});
