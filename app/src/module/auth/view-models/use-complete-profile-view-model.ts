import { useRouter } from 'expo-router';
import { useState } from 'react';

import { profileService, type ProfileService } from '@/module/auth/services/profile-service';
import { useSessionStore } from '@/module/auth/store/use-session-store';

export type CompleteProfileStatus = 'idle' | 'submitting' | 'error';

export function useCompleteProfileViewModel(profiles: ProfileService = profileService) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [status, setStatus] = useState<CompleteProfileStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const submitName = async () => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError('Enter your name.');
      setStatus('error');
      return;
    }

    const session = useSessionStore.getState().session;
    if (!session) {
      setError('Your session is no longer available.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setError(null);
    try {
      const user = await profiles.updateName(session, normalizedName);
      useSessionStore.getState().setUser(user);
      router.replace('/');
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Unable to update your profile.');
      setStatus('error');
    }
  };

  return { error, name, setName, status, submitName };
}
