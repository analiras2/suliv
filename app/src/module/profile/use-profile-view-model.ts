import { useQuery } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';

import type { IconName } from '@/components/atoms/icon';
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

const MY_RECIPES_ROUTE = '/profile/my-recipes' as Href;

const SETTINGS: ProfileSettingItem[] = [
  { id: 'account', icon: 'user', label: 'Conta' },
  { id: 'my-recipes', icon: 'leaf', label: 'Minhas receitas' },
  { id: 'search-preferences', icon: 'filter', label: 'Preferências de busca' },
  { id: 'notifications', icon: 'bell', label: 'Notificações' },
  { id: 'about', icon: 'settings', label: 'Sobre o Suliv' },
  { id: 'delete-account', icon: 'user', label: 'Excluir conta', tone: 'danger' },
  { id: 'sign-out', icon: 'logOut', label: 'Sair', tone: 'danger' },
];

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
      setActionError(caught instanceof Error ? caught.message : 'Unable to sign out.');
    } finally {
      useSessionStore.getState().setSession(null);
      router.replace(LOGIN_ROUTE);
      setIsSigningOut(false);
    }
  };

  const settings = SETTINGS.map((item) => ({
    ...item,
    onPress:
      item.id === 'sign-out'
        ? () => void signOut()
        : item.id === 'delete-account'
          ? account.requestAccountDeletion
          : item.id === 'my-recipes'
            ? () => router.push(MY_RECIPES_ROUTE)
            : undefined,
    testID: `settings-${item.id}`,
  }));
  const user = profile.data ?? cachedUser;

  return {
    error: account.error ?? actionError ?? (profile.error instanceof Error ? profile.error.message : null),
    isLoading: status === 'loading' || profile.isPending,
    isWorking: isSigningOut || account.isDeleting,
    name: user?.name ?? user?.username ?? '',
    settings,
  };
}
