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

const GROUP_SEGMENT_PREFIX = '(';

/**
 * Restoring a session must not throw away where the app opened. A cold start from a deep link
 * lands on a screen the user asked for (a recipe, a tab); sending them to the home route after
 * the profile loads would lose it. The current screen is kept when it is a standalone route
 * (outside any group, such as a recipe) or already belongs to the group the profile is meant for.
 * Before the navigator has mounted any route nothing can be told yet, and a cold start from a
 * link restores the session first: the root guard already mounts the group the profile belongs
 * to, so the caller must not navigate. Inside another group (login, complete-profile) it still
 * has to.
 */
export function shouldKeepCurrentRoute(segments: readonly string[], destination: Href): boolean {
  const [firstSegment] = segments;
  if (!firstSegment) return true;
  const isStandaloneScreen = !firstSegment.startsWith(GROUP_SEGMENT_PREFIX);
  return isStandaloneScreen || `/${firstSegment}` === String(destination);
}
