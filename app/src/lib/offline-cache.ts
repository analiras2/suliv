import { MMKV } from 'react-native-mmkv';

/**
 * Typed key-value cache for non-sensitive offline reads (e.g. the profile
 * snapshot used at splash time). Wraps MMKV with JSON serialization so feature
 * modules never touch the raw MMKV instance directly. Sensitive data such as
 * the session token stays in `expo-secure-store`, never here (see ADR-001).
 */
export interface OfflineCache {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

function createStorage(): MMKV | null {
  try {
    return new MMKV();
  } catch (error) {
    // MMKV links native code; a missed dev-client rebuild fails here at first
    // access rather than at build time. Log it clearly instead of crashing so
    // reads degrade to cache misses (see TechSpec Known Risks / ADR-001).
    console.error('Failed to initialize MMKV storage.', error);
    return null;
  }
}

const storage = createStorage();

export const offlineCache: OfflineCache = {
  get<T>(key: string): T | null {
    try {
      const raw = storage?.getString(key);
      if (raw == null) return null;
      return JSON.parse(raw) as T;
    } catch {
      // Treat any read/parse failure (corrupted stored value, native error) as
      // a cache miss rather than propagating the throw to callers.
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    storage?.set(key, JSON.stringify(value));
  },

  remove(key: string): void {
    storage?.delete(key);
  },
};
