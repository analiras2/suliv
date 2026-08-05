import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

const PUBLIC_PATHS = ['/login'];

interface JwtHeader {
  alg?: string;
}

interface JwtPayload {
  exp?: number;
}

function decodeBase64UrlJson<T>(value: string): T | null {
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );
    return JSON.parse(atob(padded)) as T;
  } catch {
    return null;
  }
}

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signaturesMatch(actual: string, expected: string): boolean {
  if (actual.length !== expected.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < actual.length; index += 1) {
    diff |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return diff === 0;
}

async function verifyHs256Signature(
  signingInput: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signingInput),
  );
  return signaturesMatch(signature, toBase64Url(digest));
}

async function isSessionTokenValid(token: string): Promise<boolean> {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    return false;
  }

  const segments = token.split('.');
  if (segments.length !== 3) {
    return false;
  }

  const [encodedHeader, encodedPayload, signature] = segments;
  const header = decodeBase64UrlJson<JwtHeader>(encodedHeader);
  const payload = decodeBase64UrlJson<JwtPayload>(encodedPayload);
  if (
    header?.alg !== 'HS256' ||
    typeof payload?.exp !== 'number' ||
    payload.exp * 1000 <= Date.now()
  ) {
    return false;
  }

  return verifyHs256Signature(
    `${encodedHeader}.${encodedPayload}`,
    signature,
    secret,
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasValidSession = sessionCookie
    ? await isSessionTokenValid(sessionCookie)
    : false;
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
