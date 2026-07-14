import { useRouter, useSegments, type Href } from 'expo-router';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { authService, type AuthService } from '@/module/auth/services/auth-service';
import {
  profileService,
  ProfileServiceError,
  type ProfileService,
} from '@/module/auth/services/profile-service';
import { useSessionStore } from '@/module/auth/store/use-session-store';

const UNAUTHORIZED_STATUS = 401;
const COMPLETE_PROFILE_ROUTE = '/complete-profile' as Href;
const LOGIN_ROUTE = '/login' as Href;

export function useSessionViewModel(
  authentication: AuthService = authService,
  profiles: ProfileService = profileService,
) {
  const router = useRouter();
  const segments = useSegments();
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const [error, setError] = useState<string | null>(null);
  const hasRestoredSession = useRef(false);

  const restoreSession = async () => {
    try {
      const session = await authentication.getSession();
      useSessionStore.getState().setSession(session);
      if (!session) return;

      const result = await profiles.bootstrap(session);
      useSessionStore.getState().setUser(result.user);
      router.replace(result.missingName ? COMPLETE_PROFILE_ROUTE : '/');
    } catch (caught: unknown) {
      if (caught instanceof ProfileServiceError && caught.status === UNAUTHORIZED_STATUS) {
        await authentication.signOut().catch(() => undefined);
        useSessionStore.getState().setSession(null);
        router.replace(LOGIN_ROUTE);
        return;
      }

      const hasSession = Boolean(useSessionStore.getState().session);
      if (!hasSession) useSessionStore.getState().setSession(null);
      else router.replace('/');
      setError(caught instanceof Error ? caught.message : 'Unable to restore your session.');
    }
  };

  const restorePersistedSession = useEffectEvent(restoreSession);

  useEffect(() => {
    const unsubscribe = authentication.onAuthStateChange((session) => {
      if (!hasRestoredSession.current) return;
      useSessionStore.getState().setSession(session);
    });
    const restoreTimer = setTimeout(() => {
      void restorePersistedSession().finally(() => {
        hasRestoredSession.current = true;
      });
    }, 0);
    return () => {
      clearTimeout(restoreTimer);
      unsubscribe();
    };
  }, [authentication]);

  useEffect(() => {
    if (status === 'authenticated' && user?.name && String(segments[0]) === '(auth)') {
      router.replace('/');
    }
  }, [router, segments, status, user?.name]);

  return { error, status };
}
