import { describe, expect, it } from '@jest/globals';

import { resolveHomeRoute, shouldKeepCurrentRoute } from '@/module/auth/navigation';
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

describe('shouldKeepCurrentRoute', () => {
  it('keeps a standalone deep-linked screen such as a recipe', () => {
    expect(shouldKeepCurrentRoute(['recipe', '[slug]'], '/(tabs)')).toBe(true);
    expect(shouldKeepCurrentRoute(['r', '[slug]'], '/(onboarding)')).toBe(true);
  });

  it('keeps any screen of the group the profile already belongs to', () => {
    expect(shouldKeepCurrentRoute(['(tabs)'], '/(tabs)')).toBe(true);
    expect(shouldKeepCurrentRoute(['(tabs)', 'search'], '/(tabs)')).toBe(true);
    expect(shouldKeepCurrentRoute(['(onboarding)', 'steps'], '/(onboarding)')).toBe(true);
  });

  it('does not keep a screen of another group', () => {
    expect(shouldKeepCurrentRoute(['(auth)', 'login'], '/(tabs)')).toBe(false);
    expect(shouldKeepCurrentRoute(['(tabs)'], '/(onboarding)')).toBe(false);
  });

  it('keeps the initial route while the navigator has not mounted one yet', () => {
    expect(shouldKeepCurrentRoute([], '/(tabs)')).toBe(true);
  });
});
