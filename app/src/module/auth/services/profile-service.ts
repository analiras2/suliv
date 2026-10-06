import { apiRequest, apiRequestJson } from '@/lib/api-client';
import type { UserProfile } from '@/module/auth/types';

export interface BootstrapResponse {
  user: UserProfile;
  missingName: boolean;
}

export interface ProfileService {
  bootstrap(): Promise<BootstrapResponse>;
  getMe(signal?: AbortSignal): Promise<UserProfile>;
  updateName(name: string): Promise<UserProfile>;
  deleteMe(): Promise<void>;
}

export const profileService: ProfileService = {
  bootstrap: () => apiRequestJson<BootstrapResponse>('/me/bootstrap', { method: 'POST', body: {} }),
  getMe: (signal) => apiRequestJson<UserProfile>('/me', { signal }),
  updateName: (name) => apiRequestJson<UserProfile>('/me', { method: 'PATCH', body: { name } }),
  deleteMe: async () => {
    await apiRequest('/me', { method: 'DELETE' });
  },
};
