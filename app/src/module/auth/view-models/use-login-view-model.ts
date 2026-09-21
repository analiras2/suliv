import type { Session } from '@supabase/supabase-js';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { AUTH_MESSAGES } from '@/module/auth/messages';
import { resolveHomeRoute } from '@/module/auth/navigation';
import { authService, type AuthService, type OAuthProvider } from '@/module/auth/services/auth-service';
import { profileService, type ProfileService } from '@/module/auth/services/profile-service';
import { useSessionStore } from '@/module/auth/store/use-session-store';

const EMAIL_LOCAL_MAX_LENGTH = 64;
const EMAIL_DOMAIN_MAX_LENGTH = 255;
const EMAIL_TLD_MAX_LENGTH = 24;
// Bounded quantifiers (vs. unbounded `+`) keep this linear time to satisfy
// sonarjs/super-linear-regex while still validating a plain email shape.
const EMAIL_PATTERN = new RegExp(
  `^[^\\s@]{1,${EMAIL_LOCAL_MAX_LENGTH}}@[^\\s@]{1,${EMAIL_DOMAIN_MAX_LENGTH}}\\.[^\\s@]{1,${EMAIL_TLD_MAX_LENGTH}}$`,
);
const COMPLETE_PROFILE_ROUTE = '/complete-profile' as Href;

export type LoginStatus = 'idle' | 'submitting' | 'sent' | 'authenticating' | 'error';

export function useLoginViewModel(
  authentication: AuthService = authService,
  profiles: ProfileService = profileService,
) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const handledToken = useRef<string | null>(null);

  const processSession = async (session: Session) => {
    if (handledToken.current === session.access_token) return;
    handledToken.current = session.access_token;
    setStatus('authenticating');
    setError(null);

    try {
      useSessionStore.getState().setSession(session);
      const result = await profiles.bootstrap(session);
      useSessionStore.getState().setUser(result.user);
      router.replace(result.missingName ? COMPLETE_PROFILE_ROUTE : resolveHomeRoute(result.user));
    } catch (caught: unknown) {
      handledToken.current = null;
      setError(caught instanceof Error ? caught.message : AUTH_MESSAGES.finishSignInFailed);
      setStatus('error');
    }
  };

  const processAuthSession = useEffectEvent(processSession);

  useEffect(() => authentication.onAuthStateChange((session) => {
    if (session) void processAuthSession(session);
  }), [authentication]);

  const submitEmail = async () => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(AUTH_MESSAGES.invalidEmail);
      setStatus('error');
      return;
    }
    setStatus('submitting');
    setError(null);
    try {
      await authentication.signInWithMagicLink(email.trim());
      setStatus('sent');
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : AUTH_MESSAGES.magicLinkFailed);
      setStatus('error');
    }
  };

  const signInWithOAuth = async (provider: OAuthProvider) => {
    setStatus('submitting');
    setError(null);
    try {
      await authentication.signInWithOAuth(provider);
      const session = await authentication.getSession();
      if (session) await processSession(session);
      else setStatus('idle');
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : AUTH_MESSAGES.signInFailed);
      setStatus('error');
    }
  };

  return { email, error, setEmail, signInWithOAuth, status, submitEmail };
}
