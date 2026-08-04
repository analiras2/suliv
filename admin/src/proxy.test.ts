/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { proxy } from './proxy';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

function makeJwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

function makeRequest(pathname: string, cookieValue?: string): NextRequest {
  const url = `https://admin.example.com${pathname}`;
  const headers = cookieValue ? { cookie: `${SESSION_COOKIE_NAME}=${cookieValue}` } : undefined;
  return new NextRequest(url, headers ? { headers } : undefined);
}

describe('proxy', () => {
  it('allows a valid session cookie into a protected route', () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    const response = proxy(makeRequest('/recipes', token));

    expect(response.status).toBe(200);
  });

  it('redirects to /login when there is no session cookie', () => {
    const response = proxy(makeRequest('/recipes'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('redirects to /login and clears the cookie when the JWT is expired', () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
    const response = proxy(makeRequest('/recipes', token));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('');
  });

  it('redirects to /login and clears the cookie when the cookie is malformed', () => {
    const response = proxy(makeRequest('/recipes', 'not-a-jwt'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('');
  });

  it('redirects away from /login when the session cookie is valid', () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    const response = proxy(makeRequest('/login', token));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/recipes');
  });

  it('lets an invalid cookie reach /login and clears it instead of redirecting away', () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
    const response = proxy(makeRequest('/login', token));

    expect(response.status).toBe(200);
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('');
  });
});
