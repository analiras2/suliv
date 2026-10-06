import { authService } from '@/module/auth/services/auth-service';
import { useSessionStore } from '@/module/auth/store/use-session-store';

let inFlight: Promise<void> | null = null;

async function endSession(): Promise<void> {
  try {
    await authService.signOut();
  } catch {
    // A failed local sign-out must not keep the user on a screen with a dead session.
  }
  const { setAuthNotice, setSession } = useSessionStore.getState();
  setAuthNotice('AUTH_SESSION_EXPIRED');
  setSession(null);
}

/**
 * Ends the session after an authenticated request got a 401 (ADR-008). The
 * in-flight promise makes concurrent 401s run the sequence exactly once; the
 * existing root layout guard then routes to `(auth)`.
 */
export function endSessionAfterUnauthorized(): Promise<void> {
  if (!inFlight) {
    inFlight = endSession().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
