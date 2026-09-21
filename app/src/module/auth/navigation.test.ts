import { describe, expect, it } from '@jest/globals';

import { resolveHomeRoute } from '@/module/auth/navigation';
import type { UserProfile } from '@/module/auth/types';

const COMPLETED_AT = '2026-01-01T00:00:00.000Z';

function profileWith(onboardingCompletedAt: string | null): UserProfile {
  return { id: 'user-1', name: 'Ana', onboardingCompletedAt } as UserProfile;
}

describe('resolveHomeRoute', () => {
  it('sends a profile that has not finished onboarding to the onboarding group', () => {
    expect(resolveHomeRoute(profileWith(null))).toBe('/(onboarding)');
  });

  it('sends an onboarded profile to the tabs group', () => {
    expect(resolveHomeRoute(profileWith(COMPLETED_AT))).toBe('/(tabs)');
  });

  it('falls back to the tabs group when the profile has not loaded', () => {
    expect(resolveHomeRoute(null)).toBe('/(tabs)');
  });
});
