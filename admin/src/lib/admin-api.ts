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

export class AdminLoginError extends Error {}

const GENERIC_LOGIN_ERROR_MESSAGE = 'Invalid email or password';

export async function loginAdmin(email: string, password: string): Promise<AdminLoginResponse> {
  const response = await fetch(`${ADMIN_API_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

  if (!response.ok) {
    // Never surface a distinct message for wrong-password vs. nonexistent-email.
    throw new AdminLoginError(GENERIC_LOGIN_ERROR_MESSAGE);
  }

  return response.json();
}
