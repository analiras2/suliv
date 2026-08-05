import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AdminLoginError, loginAdmin } from '@/lib/admin-api';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

export async function POST(request: Request): Promise<NextResponse> {
  const { email, password } = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ message: 'Invalid email or password' }, { status: 400 });
  }

  try {
    const { token } = await loginAdmin(email, password);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminLoginError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    throw error;
  }
}
