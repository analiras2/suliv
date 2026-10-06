import { useRouter, useSegments, type Href } from 'expo-router';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { ApiError } from '@/lib/api-error';
import { AUTH_MESSAGES, getErrorMessage } from '@/lib/error-messages';
import { resolveHomeRoute } from '@/module/auth/navigation';
import { authService, type AuthService } from '@/module/auth/services/auth-service';
import { profileService, type ProfileService } from '@/module/auth/services/profile-service';
import { useSessionStore } from '@/module/auth/store/use-session-store';

const COMPLETE_PROFILE_ROUTE = '/complete-profile' as Href;

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

      const result = await profiles.bootstrap();
      useSessionStore.getState().setUser(result.user);
      router.replace(result.missingName ? COMPLETE_PROFILE_ROUTE : resolveHomeRoute(result.user));
    } catch (caught: unknown) {
      // A 401 already ended the session centrally (ADR-008); the login screen shows its notice.
      if (caught instanceof ApiError && caught.code === 'UNAUTHORIZED') return;

      const hasSession = Boolean(useSessionStore.getState().session);
      if (!hasSession) useSessionStore.getState().setSession(null);
      else router.replace(resolveHomeRoute(useSessionStore.getState().user));
      setError(getErrorMessage(caught, AUTH_MESSAGES.restoreSessionFailed));
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
      router.replace(resolveHomeRoute(user));
    }
  }, [router, segments, status, user]);

  return { error, status };
}
