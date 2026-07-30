import { useCallback, useState } from 'react';
import { useRouter, type Href } from 'expo-router';

import { analyticsClient, type AnalyticsClient } from '@/lib/analytics';
import { useThemePreferenceStore, type ThemePreference } from '@/lib/theme-preference';
import { authService } from '@/module/auth/services/auth-service';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import { useAccountViewModel } from '@/module/auth/view-models/use-account-view-model';
import type { CookingFrequency, CookingLevel, DietPreference } from '@/module/onboarding/services/onboarding-service';
import { profileService, type ProfileService } from '@/module/profile/services/profile-service';

const LOGIN_ROUTE = '/login' as Href;

export function useSettingsViewModel(
  profiles: ProfileService = profileService,
  analytics: AnalyticsClient = analyticsClient,
) {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);
  const themePreference = useThemePreferenceStore((state) => state.preference);
  const setThemePreference = useThemePreferenceStore((state) => state.setPreference);
  const account = useAccountViewModel();
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const applyUpdate = useCallback(
    async (fieldsChanged: string[], mutate: () => Promise<Parameters<typeof setUser>[0]>) => {
      setError(null);
      try {
        const updated = await mutate();
        setUser(updated);
        analytics.track('profile_updated', { fields_changed: fieldsChanged });
      } catch (caught: unknown) {
        setError(caught instanceof Error ? caught.message : 'Unable to update your profile.');
      }
    },
    [analytics, setUser],
  );

  const updateDietPreference = useCallback(
    (value: DietPreference) => applyUpdate(['diet_preference'], () => profiles.updateProfile({ dietPreference: value })),
    [applyUpdate, profiles],
  );

  const updateCookingLevel = useCallback(
    (value: CookingLevel) => applyUpdate(['cooking_level'], () => profiles.updateProfile({ cookingLevel: value })),
    [applyUpdate, profiles],
  );

  const updateCookingFrequency = useCallback(
    (value: CookingFrequency) =>
      applyUpdate(['cooking_frequency'], () => profiles.updateProfile({ cookingFrequency: value })),
    [applyUpdate, profiles],
  );

  const updateAllergies = useCallback(
    (allergenIds: string[], newTerm?: string) =>
      applyUpdate(['allergies'], () => profiles.updateAllergies(allergenIds, newTerm)),
    [applyUpdate, profiles],
  );

  const setPreference = useCallback(
    (preference: ThemePreference) => setThemePreference(preference),
    [setThemePreference],
  );

  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await authService.signOut();
    } finally {
      useSessionStore.getState().setSession(null);
      router.replace(LOGIN_ROUTE);
      setIsSigningOut(false);
    }
  }, [router]);

  return {
    user,
    themePreference,
    error: error ?? account.error,
    isWorking: isSigningOut || account.isDeleting,
    updateDietPreference,
    updateCookingLevel,
    updateCookingFrequency,
    updateAllergies,
    setThemePreference: setPreference,
    signOut,
    requestAccountDeletion: account.requestAccountDeletion,
  };
}
