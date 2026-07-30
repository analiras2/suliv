import { describe, expect, it, jest } from '@jest/globals';

import type { OfflineCache } from '@/lib/offline-cache';

import { createThemePreferenceStore, THEME_PREFERENCE_CACHE_KEY } from './theme-preference';

function createMemoryCache(): OfflineCache {
  const memory = new Map<string, unknown>();
  return {
    get: jest.fn((key: string) => (memory.has(key) ? (memory.get(key) as never) : null)),
    set: jest.fn((key: string, value: unknown) => {
      memory.set(key, value);
    }),
    remove: jest.fn((key: string) => memory.delete(key)),
  };
}

describe('themePreferenceStore', () => {
  it('UT-010: defaults to system when no prior value is set', () => {
    const cache = createMemoryCache();
    const store = createThemePreferenceStore(cache);
    expect(store.getState().preference).toBe('system');
  });

  it('UT-009: setPreference persists to offline-cache and rehydrates on next creation', () => {
    const cache = createMemoryCache();
    const store = createThemePreferenceStore(cache);

    store.getState().setPreference('dark');

    expect(store.getState().preference).toBe('dark');
    expect(cache.set).toHaveBeenCalledWith(THEME_PREFERENCE_CACHE_KEY, 'dark');

    const rehydrated = createThemePreferenceStore(cache);
    expect(rehydrated.getState().preference).toBe('dark');
  });
});
