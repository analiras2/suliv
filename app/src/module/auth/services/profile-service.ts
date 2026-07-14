import type { Session } from '@supabase/supabase-js';

import type { UserProfile } from '@/module/auth/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface BootstrapResponse {
  user: UserProfile;
  missingName: boolean;
}

export interface ProfileService {
  bootstrap(session: Session): Promise<BootstrapResponse>;
  getMe(session: Session): Promise<UserProfile>;
  updateName(session: Session, name: string): Promise<UserProfile>;
  deleteMe(session: Session): Promise<void>;
}

export class ProfileServiceError extends Error {
  constructor(readonly status: number) {
    super(`Profile request failed with status ${status}.`);
  }
}

async function request(
  session: Session,
  path: string,
  method: 'DELETE' | 'GET' | 'PATCH' | 'POST',
  body?: Record<string, string>,
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new ProfileServiceError(response.status);
  }

  return response;
}

async function requestJson<T>(session: Session, path: string, method: 'GET' | 'PATCH' | 'POST', body?: Record<string, string>) {
  const response = await request(session, path, method, body);
  return response.json() as Promise<T>;
}

export const profileService: ProfileService = {
  bootstrap: (session) => requestJson<BootstrapResponse>(session, '/me/bootstrap', 'POST', {}),
  getMe: (session) => requestJson<UserProfile>(session, '/me', 'GET'),
  updateName: (session, name) => requestJson<UserProfile>(session, '/me', 'PATCH', { name }),
  deleteMe: async (session) => { await request(session, '/me', 'DELETE'); },
};
