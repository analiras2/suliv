/**
 * @jest-environment node
 */
import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

const TEST_ADMIN_JWT_SECRET = 'test-admin-secret';

function makeJwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const signingInput = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}`;
  const signature = createHmac('sha256', TEST_ADMIN_JWT_SECRET)
    .update(signingInput)
    .digest('base64url');
  return `${signingInput}.${signature}`;
}

function makeForgedJwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

function makeRequest(pathname: string, cookieValue?: string): NextRequest {
  const url = `https://admin.example.com${pathname}`;
  const headers = cookieValue ? { cookie: `${SESSION_COOKIE_NAME}=${cookieValue}` } : undefined;
  return new NextRequest(url, headers ? { headers } : undefined);
}

describe('proxy', () => {
  beforeEach(() => {
    process.env.ADMIN_JWT_SECRET = TEST_ADMIN_JWT_SECRET;
  });

  it('allows a valid signed session cookie into a protected route', async () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    const response = await proxy(makeRequest('/recipes', token));

    expect(response.status).toBe(200);
  });

  it('redirects to /login when there is no session cookie', async () => {
    const response = await proxy(makeRequest('/recipes'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('redirects to /login and clears the cookie when the JWT is expired', async () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
    const response = await proxy(makeRequest('/recipes', token));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('');
  });

  it('redirects to /login and clears the cookie when the cookie is malformed', async () => {
    const response = await proxy(makeRequest('/recipes', 'not-a-jwt'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('');
  });

  it('redirects to /login and clears a forged future-exp cookie', async () => {
    const token = makeForgedJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    const response = await proxy(makeRequest('/recipes', token));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('');
  });

  it('redirects away from /login when the session cookie is valid', async () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    const response = await proxy(makeRequest('/login', token));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/recipes');
  });

  it('lets an invalid cookie reach /login and clears it instead of redirecting away', async () => {
    const token = makeJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
    const response = await proxy(makeRequest('/login', token));

    expect(response.status).toBe(200);
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('');
  });
});
