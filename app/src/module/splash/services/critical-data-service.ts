import type { Session } from '@supabase/supabase-js';

import { offlineCache, type OfflineCache } from '@/lib/offline-cache';
import { authService, type AuthService } from '@/module/auth/services/auth-service';
import { profileService, type ProfileService } from '@/module/auth/services/profile-service';
import type { UserProfile } from '@/module/auth/types';

export const PROFILE_SNAPSHOT_CACHE_KEY = 'cache:profile-snapshot';
export const CRITICAL_DATA_TIMEOUT_MS = 8000;

export interface ProfileSnapshot {
  id: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  onboardingCompletedAt: string | null;
  cachedAt: string;
}

export type CriticalDataResult =
  | { kind: 'online'; profile: ProfileSnapshot }
  | { kind: 'offline'; profile: ProfileSnapshot }
  | { kind: 'unavailable' };

export interface CriticalDataService {
  load(): Promise<CriticalDataResult>;
}

function toSnapshot(profile: UserProfile): ProfileSnapshot {
  return {
    id: profile.id,
    name: profile.name,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
    onboardingCompletedAt: profile.onboardingCompletedAt,
    cachedAt: new Date().toISOString(),
  };
}

async function fetchWithTimeout(profiles: ProfileService, session: Session): Promise<UserProfile> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CRITICAL_DATA_TIMEOUT_MS);
  try {
    return await profiles.getMe(session, controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

export function createCriticalDataService(
  authentication: AuthService = authService,
  profiles: ProfileService = profileService,
  cache: OfflineCache = offlineCache,
): CriticalDataService {
  return {
    async load(): Promise<CriticalDataResult> {
      const session = await authentication.getSession();
      if (!session) {
        return { kind: 'unavailable' };
      }

      try {
        const profile = await fetchWithTimeout(profiles, session);
        const snapshot = toSnapshot(profile);
        cache.set(PROFILE_SNAPSHOT_CACHE_KEY, snapshot);
        return { kind: 'online', profile: snapshot };
      } catch {
        const cached = cache.get<ProfileSnapshot>(PROFILE_SNAPSHOT_CACHE_KEY);
        if (cached) {
          return { kind: 'offline', profile: cached };
        }
        return { kind: 'unavailable' };
      }
    },
  };
}

export const criticalDataService = createCriticalDataService();
