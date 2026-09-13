import type { Href } from 'expo-router';

import type { UserProfile } from '@/module/auth/types';

const ONBOARDING_ROUTE = '/(onboarding)' as Href;
const TABS_ROUTE = '/(tabs)' as Href;

/**
 * '/' matches both (onboarding)/index and (tabs)/index. The root Stack.Protected hides one of
 * them, and a replace that resolves to the hidden route is dropped without any error, so
 * navigation after auth names the group the profile belongs to. Without a loaded profile
 * (an offline restore) the guard has already mounted the right group, so the feed is the
 * safe default.
 */
export function resolveHomeRoute(user: UserProfile | null): Href {
  return user?.onboardingCompletedAt === null ? ONBOARDING_ROUTE : TABS_ROUTE;
}
