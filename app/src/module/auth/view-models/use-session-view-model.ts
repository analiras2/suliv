import { useRouter, useSegments, type Href } from 'expo-router';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { ApiError } from '@/lib/api-error';
import { AUTH_MESSAGES, getErrorMessage } from '@/lib/error-messages';
import { resolveHomeRoute, shouldKeepCurrentRoute } from '@/module/auth/navigation';
import { authService, type AuthService } from '@/module/auth/services/auth-service';
import { profileService, type ProfileService } from '@/module/auth/services/profile-service';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import type { UserProfile } from '@/module/auth/types';

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
  // restoreSession awaits the network, so it has to read the route the app is on when it
  // resumes, not the one it started from.
  const currentSegments = useRef<readonly string[]>(segments);

  useEffect(() => {
    currentSegments.current = segments;
  }, [segments]);

  const goToHome = (profile: UserProfile | null) => {
    const home = resolveHomeRoute(profile);
    if (shouldKeepCurrentRoute(currentSegments.current, home)) return;
    router.replace(home);
  };

  const restoreSession = async () => {
    try {
      const session = await authentication.getSession();
      useSessionStore.getState().setSession(session);
      if (!session) return;

      const result = await profiles.bootstrap();
      useSessionStore.getState().setUser(result.user);
      if (result.missingName) router.replace(COMPLETE_PROFILE_ROUTE);
      else goToHome(result.user);
    } catch (caught: unknown) {
      // A 401 already ended the session centrally (ADR-008); the login screen shows its notice.
      if (caught instanceof ApiError && caught.code === 'UNAUTHORIZED') return;

      const hasSession = Boolean(useSessionStore.getState().session);
      if (!hasSession) useSessionStore.getState().setSession(null);
      else goToHome(useSessionStore.getState().user);
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
