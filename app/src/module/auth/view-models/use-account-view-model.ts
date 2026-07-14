import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { authService, type AuthService } from '@/module/auth/services/auth-service';
import { profileService, type ProfileService } from '@/module/auth/services/profile-service';
import { useSessionStore } from '@/module/auth/store/use-session-store';

const LOGIN_ROUTE = '/login' as Href;

export function useAccountViewModel(
  authentication: AuthService = authService,
  profiles: ProfileService = profileService,
) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAccount = async () => {
    const session = useSessionStore.getState().session;
    if (!session) {
      useSessionStore.getState().setSession(null);
      router.replace(LOGIN_ROUTE);
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      await profiles.deleteMe(session);
      await authentication.signOut().catch(() => undefined);
      useSessionStore.getState().setUser(null);
      useSessionStore.getState().setSession(null);
      router.replace(LOGIN_ROUTE);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete your account.');
    } finally {
      setIsDeleting(false);
    }
  };

  const requestAccountDeletion = () => Alert.alert(
    'Excluir conta?',
    'Seus dados pessoais serão removidos. Esta ação não pode ser desfeita.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir conta', style: 'destructive', onPress: deleteAccount },
    ],
  );

  return { deleteAccount, error, isDeleting, requestAccountDeletion };
}
