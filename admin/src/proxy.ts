import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

const PUBLIC_PATHS = ['/login'];

interface JwtPayload {
  exp?: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const segments = token.split('.');
  if (segments.length !== 3) {
    return null;
  }

  try {
    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

function isSessionTokenValid(token: string): boolean {
  const payload = decodeJwtPayload(token);
  return typeof payload?.exp === 'number' && payload.exp * 1000 > Date.now();
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasValidSession = sessionCookie ? isSessionTokenValid(sessionCookie) : false;
  const hasStaleCookie = Boolean(sessionCookie) && !hasValidSession;

  if (!isPublicPath && !hasValidSession) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    if (hasStaleCookie) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  if (isPublicPath && hasValidSession) {
    return NextResponse.redirect(new URL('/recipes', request.url));
  }

  const response = NextResponse.next();
  if (hasStaleCookie) {
    response.cookies.delete(SESSION_COOKIE_NAME);
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
