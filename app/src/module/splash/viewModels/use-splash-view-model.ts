import { useCallback, useEffect, useEffectEvent, useState } from 'react';

import { authService, type AuthService } from '@/module/auth/services/auth-service';
import {
  criticalDataService,
  type CriticalDataService,
} from '@/module/splash/services/critical-data-service';

export type SplashStatus = 'loading' | 'ready' | 'offline' | 'blocked-login' | 'error';
export type InitialRoute = '(auth)' | '(onboarding)' | '(tabs)' | null;

export interface SplashViewModel {
  status: SplashStatus;
  initialRoute: InitialRoute;
  retry: () => void;
}

function routeForOnboarding(onboardingCompletedAt: string | null): '(onboarding)' | '(tabs)' {
  return onboardingCompletedAt === null ? '(onboarding)' : '(tabs)';
}

export function useSplashViewModel(
  dataService: CriticalDataService = criticalDataService,
  authentication: AuthService = authService,
): SplashViewModel {
  const [status, setStatus] = useState<SplashStatus>('loading');
  const [initialRoute, setInitialRoute] = useState<InitialRoute>(null);

  const resolve = useCallback(async () => {
    setStatus('loading');
    setInitialRoute(null);

    const session = await authentication.getSession();
    if (!session) {
      setInitialRoute('(auth)');
      setStatus('ready');
      return;
    }

    const result = await dataService.load();
    switch (result.kind) {
      case 'online':
        setInitialRoute(routeForOnboarding(result.profile.onboardingCompletedAt));
        setStatus('ready');
        break;
      case 'offline':
        setInitialRoute(routeForOnboarding(result.profile.onboardingCompletedAt));
        setStatus('offline');
        break;
      case 'unavailable':
        setInitialRoute(null);
        setStatus('error');
        break;
    }
  }, [authentication, dataService]);

  const resolveOnMount = useEffectEvent(resolve);

  useEffect(() => {
    const timer = setTimeout(() => void resolveOnMount(), 0);
    return () => clearTimeout(timer);
  }, []);

  return { status, initialRoute, retry: () => void resolve() };
}
