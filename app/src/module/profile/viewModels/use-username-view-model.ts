import { useRouter } from 'expo-router';
import { useState } from 'react';

import { getErrorMessage, getFieldErrors } from '@/lib/error-messages';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import { profileService, type ProfileService } from '@/module/profile/services/profile-service';

const UPDATE_USERNAME_FAILED_MESSAGE = 'Não foi possível atualizar seu nome de usuário.';

export type UsernameStatus = 'idle' | 'submitting' | 'error';

export function useUsernameViewModel(profiles: ProfileService = profileService) {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);
  const [username, setUsername] = useState(user?.username ?? '');
  const [status, setStatus] = useState<UsernameStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    const nextUsername = username.trim();
    if (status === 'submitting') return;
    if (nextUsername === user?.username) {
      router.back();
      return;
    }

    setStatus('submitting');
    setError(null);
    setFieldErrors({});
    try {
      const updated = await profiles.updateUsername(nextUsername);
      setUser(updated);
      router.back();
    } catch (caught: unknown) {
      // The previous username stays in the session store: it only changes on success.
      setFieldErrors(getFieldErrors(caught));
      setError(getErrorMessage(caught, UPDATE_USERNAME_FAILED_MESSAGE));
      setStatus('error');
    }
  };

  return { username, setUsername, status, error, fieldErrors, submit };
}
