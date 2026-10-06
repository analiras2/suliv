import 'server-only';
import { ADMIN_API_URL } from './constants';

export interface AdminLoginResponse {
  token: string;
  admin: {
    id: string;
    email: string;
    role: string;
  };
}

/** The API's answer to a rejected login: its status and parsed error body, forwarded unchanged. */
export class AdminLoginError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super('Admin login failed');
  }
}

export async function loginAdmin(email: string, password: string): Promise<AdminLoginResponse> {
  const response = await fetch(`${ADMIN_API_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

  if (!response.ok) {
    // The API answers wrong-password and nonexistent-email with the same code.
    throw new AdminLoginError(response.status, await response.json().catch(() => null));
  }

  return response.json();
}
