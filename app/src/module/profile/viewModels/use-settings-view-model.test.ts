import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { UserProfile } from '@/module/auth/types';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import type { ProfileService } from '@/module/profile/services/profile-service';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/module/auth/services/auth-service', () => ({
  authService: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signInWithMagicLink: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  },
}));
jest.mock('@/module/auth/services/profile-service', () => ({
  profileService: { bootstrap: jest.fn(), deleteMe: jest.fn(), getMe: jest.fn(), updateName: jest.fn() },
}));

// eslint-disable-next-line import/first
import { useSettingsViewModel } from './use-settings-view-model';

const user: UserProfile = {
  id: 'user-1',
  email: 'ana@example.com',
  name: 'Ana',
  username: 'ana',
  usernameUpdatedAt: null,
  avatarUrl: null,
  dietPreference: null,
  cookingLevel: null,
  cookingFrequency: null,
  onboardingCompletedAt: '2026-01-01T00:00:00Z',
  termsVersionAccepted: '1.0.0',
  termsAcceptedAt: '2026-01-01T00:00:00Z',
  status: 'active',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function createProfileServiceMock(): jest.Mocked<ProfileService> {
  return {
    updateProfile: jest.fn(),
    updateAllergies: jest.fn(),
  };
}

describe('useSettingsViewModel', () => {
  let profiles: jest.Mocked<ProfileService>;
  const analytics = { track: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({ session: { access_token: 'token' } as never, status: 'authenticated', user });
    profiles = createProfileServiceMock();
  });

  it('UT-001: updateDietPreference calls updateProfile and updates the session store', async () => {
    const updated = { ...user, dietPreference: 'vegano' as const };
    profiles.updateProfile.mockResolvedValue(updated);
    const { result } = await renderHook(() => useSettingsViewModel(profiles, analytics));

    await act(() => result.current.updateDietPreference('vegano'));

    expect(profiles.updateProfile).toHaveBeenCalledWith({ dietPreference: 'vegano' });
    expect(useSessionStore.getState().user).toEqual(updated);
  });

  it('UT-002: updateCookingLevel calls updateProfile and updates the session store', async () => {
    const updated = { ...user, cookingLevel: 'avancado' as const };
    profiles.updateProfile.mockResolvedValue(updated);
    const { result } = await renderHook(() => useSettingsViewModel(profiles, analytics));

    await act(() => result.current.updateCookingLevel('avancado'));

    expect(profiles.updateProfile).toHaveBeenCalledWith({ cookingLevel: 'avancado' });
    expect(useSessionStore.getState().user).toEqual(updated);
  });

  it('UT-003: updateCookingFrequency calls updateProfile and updates the session store', async () => {
    const updated = { ...user, cookingFrequency: 'quase_todo_dia' as const };
    profiles.updateProfile.mockResolvedValue(updated);
    const { result } = await renderHook(() => useSettingsViewModel(profiles, analytics));

    await act(() => result.current.updateCookingFrequency('quase_todo_dia'));

    expect(profiles.updateProfile).toHaveBeenCalledWith({ cookingFrequency: 'quase_todo_dia' });
    expect(useSessionStore.getState().user).toEqual(updated);
  });

  it('UT-004: updateAllergies without a term calls updateAllergies with no newTerm', async () => {
    profiles.updateAllergies.mockResolvedValue(user);
    const { result } = await renderHook(() => useSettingsViewModel(profiles, analytics));

    await act(() => result.current.updateAllergies(['id-leite', 'id-soja']));

    expect(profiles.updateAllergies).toHaveBeenCalledWith(['id-leite', 'id-soja'], undefined);
  });

  it('UT-005: updateAllergies with a free-text term includes it', async () => {
    profiles.updateAllergies.mockResolvedValue(user);
    const { result } = await renderHook(() => useSettingsViewModel(profiles, analytics));

    await act(() => result.current.updateAllergies(['id-leite'], 'castanha-do-para'));

    expect(profiles.updateAllergies).toHaveBeenCalledWith(['id-leite'], 'castanha-do-para');
  });

  it('UT-014: fires profile_updated with only the field just changed, for each edit type', async () => {
    profiles.updateProfile.mockResolvedValue(user);
    profiles.updateAllergies.mockResolvedValue(user);
    const { result } = await renderHook(() => useSettingsViewModel(profiles, analytics));

    await act(() => result.current.updateDietPreference('vegano'));
    expect(analytics.track).toHaveBeenLastCalledWith('profile_updated', { fields_changed: ['diet_preference'] });

    await act(() => result.current.updateCookingLevel('avancado'));
    expect(analytics.track).toHaveBeenLastCalledWith('profile_updated', { fields_changed: ['cooking_level'] });

    await act(() => result.current.updateCookingFrequency('quase_todo_dia'));
    expect(analytics.track).toHaveBeenLastCalledWith('profile_updated', { fields_changed: ['cooking_frequency'] });

    await act(() => result.current.updateAllergies(['id-leite']));
    expect(analytics.track).toHaveBeenLastCalledWith('profile_updated', { fields_changed: ['allergies'] });
  });

  it('UT-006: a rejected update surfaces an error without firing analytics or losing the session user', async () => {
    profiles.updateProfile.mockRejectedValue(new Error('Conflict'));
    const { result } = await renderHook(() => useSettingsViewModel(profiles, analytics));

    await act(() => result.current.updateDietPreference('vegano'));

    await waitFor(() => expect(result.current.error).toBe('Conflict'));
    expect(analytics.track).not.toHaveBeenCalled();
    expect(useSessionStore.getState().user).toEqual(user);
  });
});
