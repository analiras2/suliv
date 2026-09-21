import { useQuery } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';

import type { IconName } from '@/components/atoms/icon';
import { AUTH_MESSAGES } from '@/module/auth/messages';
import { authService } from '@/module/auth/services/auth-service';
import { profileService } from '@/module/auth/services/profile-service';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import { useAccountViewModel } from '@/module/auth/view-models/use-account-view-model';

const LOGIN_ROUTE = '/login' as Href;

export interface ProfileSettingItem {
  id: string;
  icon: IconName;
  label: string;
  tone?: 'default' | 'danger';
  onPress?: () => void;
  testID?: string;
}

const SETTINGS: ProfileSettingItem[] = [
  { id: 'diet-preference', icon: 'vegan', label: 'Estilo alimentar' },
  { id: 'allergies', icon: 'warning', label: 'Alergias e restrições' },
  { id: 'level-frequency', icon: 'leaf', label: 'Nível e frequência' },
  { id: 'theme', icon: 'sun', label: 'Tema' },
  { id: 'terms', icon: 'bookmark', label: 'Termos' },
  { id: 'privacy', icon: 'settings', label: 'Privacidade' },
  { id: 'my-recipes', icon: 'leaf', label: 'Minhas receitas' },
  { id: 'sign-out', icon: 'logOut', label: 'Sair', tone: 'danger' },
  { id: 'delete-account', icon: 'user', label: 'Excluir conta', tone: 'danger' },
];

const SETTINGS_ROUTES: Partial<Record<string, Href>> = {
  'diet-preference': '/profile/settings/diet' as Href,
  allergies: '/profile/settings/allergies' as Href,
  'level-frequency': '/profile/settings/level-frequency' as Href,
  theme: '/profile/settings/theme' as Href,
  terms: '/profile/settings/terms' as Href,
  privacy: '/profile/settings/privacy' as Href,
  'my-recipes': '/profile/my-recipes' as Href,
};

export function useProfileViewModel() {
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const cachedUser = useSessionStore((state) => state.user);
  const status = useSessionStore((state) => state.status);
  const account = useAccountViewModel();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const profile = useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: () => profileService.getMe(session!),
    enabled: Boolean(session),
    initialData: cachedUser ?? undefined,
  });

  const signOut = async () => {
    setIsSigningOut(true);
    setActionError(null);
    try {
      await authService.signOut();
    } catch (caught: unknown) {
      setActionError(caught instanceof Error ? caught.message : AUTH_MESSAGES.signOutFailed);
    } finally {
      useSessionStore.getState().setSession(null);
      router.replace(LOGIN_ROUTE);
      setIsSigningOut(false);
    }
  };

  const getSettingOnPress = (id: string): (() => void) | undefined => {
    if (id === 'sign-out') return () => void signOut();
    if (id === 'delete-account') return account.requestAccountDeletion;
    const route = SETTINGS_ROUTES[id];
    return route ? () => router.push(route) : undefined;
  };

  const settings = SETTINGS.map((item) => ({
    ...item,
    onPress: getSettingOnPress(item.id),
    testID: `settings-${item.id}`,
  }));
  const user = profile.data ?? cachedUser;

  return {
    error: account.error ?? actionError ?? (profile.error instanceof Error ? profile.error.message : null),
    isLoading: status === 'loading' || profile.isPending,
    isWorking: isSigningOut || account.isDeleting,
    name: user?.name ?? user?.username ?? '',
    avatarUrl: user?.avatarUrl ?? null,
    username: user?.username ?? '',
    settings,
  };
}
