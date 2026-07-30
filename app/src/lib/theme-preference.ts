import { create } from 'zustand';

import { offlineCache, type OfflineCache } from '@/lib/offline-cache';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface ThemePreferenceStore {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const THEME_PREFERENCE_CACHE_KEY = 'app:theme-preference';

export function createThemePreferenceStore(cache: OfflineCache = offlineCache) {
  return create<ThemePreferenceStore>((set) => ({
    preference: cache.get<ThemePreference>(THEME_PREFERENCE_CACHE_KEY) ?? 'system',
    setPreference: (preference) => {
      cache.set(THEME_PREFERENCE_CACHE_KEY, preference);
      set({ preference });
    },
  }));
}

export const useThemePreferenceStore = createThemePreferenceStore();
