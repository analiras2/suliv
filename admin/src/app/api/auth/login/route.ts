import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AdminLoginError, loginAdmin } from '@/lib/admin-api';
import { buildErrorBody } from '@/lib/api-response-error';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;
const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_ERROR = 500;
const VALIDATION_FAILED_MESSAGE = 'Request validation failed';
const INTERNAL_ERROR_MESSAGE = 'Internal server error';

function hasErrorCode(body: unknown): boolean {
  return typeof body === 'object' && body !== null && typeof (body as { code?: unknown }).code === 'string';
}

async function readCredentials(request: Request): Promise<{ email: string; password: string } | null> {
  try {
    const { email, password } = (await request.json()) as { email?: unknown; password?: unknown };
    return {
      email: typeof email === 'string' ? email : '',
      password: typeof password === 'string' ? password : '',
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const credentials = await readCredentials(request);
  if (!credentials) {
    return NextResponse.json(buildErrorBody(HTTP_BAD_REQUEST, 'VALIDATION_FAILED', VALIDATION_FAILED_MESSAGE), {
      status: HTTP_BAD_REQUEST,
    });
  }

  // The API owns validation: forwarding even empty values gets every field's message back at once.
  try {
    const { token } = await loginAdmin(credentials.email, credentials.password);

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
      // The API's coded body is forwarded unchanged; a body without a code is not a contract we can forward.
      const body = hasErrorCode(error.body)
        ? error.body
        : buildErrorBody(HTTP_INTERNAL_ERROR, 'INTERNAL_ERROR', INTERNAL_ERROR_MESSAGE);
      return NextResponse.json(body, { status: hasErrorCode(error.body) ? error.status : HTTP_INTERNAL_ERROR });
    }
    throw error;
  }
}
