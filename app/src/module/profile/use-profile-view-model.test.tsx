import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactNode } from 'react';

import { useSessionStore } from '@/module/auth/store/use-session-store';
import type { UserProfile } from '@/module/auth/types';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace }) }));
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
  profileService: {
    bootstrap: jest.fn(),
    deleteMe: jest.fn(),
    getMe: jest.fn<() => Promise<unknown>>(),
    updateName: jest.fn(),
  },
}));

// eslint-disable-next-line import/first
import { profileService } from '@/module/auth/services/profile-service';
// eslint-disable-next-line import/first
import { useProfileViewModel } from './use-profile-view-model';

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

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useProfileViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(profileService.getMe).mockResolvedValue(user);
    useSessionStore.setState({
      session: { access_token: 'token', user: { id: 'user-1' } } as never,
      status: 'authenticated',
      user,
    });
  });

  it('exposes the real navigation rows with the required ids', async () => {
    const { result } = await renderHook(() => useProfileViewModel(), { wrapper });
    const ids = result.current.settings.map((item) => item.id);
    expect(ids).toEqual([
      'diet-preference',
      'allergies',
      'level-frequency',
      'theme',
      'terms',
      'privacy',
      'my-recipes',
      'sign-out',
      'delete-account',
    ]);
  });

  it('UT-013: tapping Minhas receitas navigates without any network request', async () => {
    const { result } = await renderHook(() => useProfileViewModel(), { wrapper });
    const myRecipes = result.current.settings.find((item) => item.id === 'my-recipes');

    await act(async () => {
      myRecipes?.onPress?.();
    });

    expect(mockPush).toHaveBeenCalledWith('/profile/my-recipes');
  });
});
