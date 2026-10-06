/**
 * @jest-environment node
 */
import { POST } from './route';

const mockLoginAdmin = jest.fn();
const mockCookieSet = jest.fn();

jest.mock('../../../../lib/admin-api', () => {
  class MockAdminLoginError extends Error {
    constructor(
      readonly status: number,
      readonly body: unknown,
    ) {
      super('Admin login failed');
    }
  }
  return { AdminLoginError: MockAdminLoginError, loginAdmin: (...args: unknown[]) => mockLoginAdmin(...args) };
});
jest.mock('next/headers', () => ({
  cookies: async () => ({ set: (...args: unknown[]) => mockCookieSet(...args) }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AdminLoginError } = require('../../../../lib/admin-api') as { AdminLoginError: new (status: number, body: unknown) => Error };

const HTTP_UNAUTHORIZED = 401;
const HTTP_BAD_REQUEST = 400;

function loginRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/auth/login', { method: 'POST', body: JSON.stringify(body) });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('UT-068 forwards the coded 401 body of the API unchanged', async () => {
    const apiBody = { statusCode: HTTP_UNAUTHORIZED, code: 'ADMIN_INVALID_CREDENTIALS', message: 'Invalid email or password' };
    mockLoginAdmin.mockRejectedValue(new AdminLoginError(HTTP_UNAUTHORIZED, apiBody));

    const response = await POST(loginRequest({ email: 'a@b.co', password: 'wrong' }));

    expect(response.status).toBe(HTTP_UNAUTHORIZED);
    await expect(response.json()).resolves.toEqual(apiBody);
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it('forwards the API validation details unchanged', async () => {
    const apiBody = {
      statusCode: HTTP_BAD_REQUEST,
      code: 'VALIDATION_FAILED',
      message: 'Request validation failed',
      details: [{ field: 'email', constraint: 'isEmail' }],
    };
    mockLoginAdmin.mockRejectedValue(new AdminLoginError(HTTP_BAD_REQUEST, apiBody));

    const response = await POST(loginRequest({ email: 'x', password: 'secret' }));

    expect(response.status).toBe(HTTP_BAD_REQUEST);
    await expect(response.json()).resolves.toEqual(apiBody);
  });

  it('lets the API validate a missing field by forwarding an empty value', async () => {
    mockLoginAdmin.mockRejectedValue(new AdminLoginError(HTTP_BAD_REQUEST, { code: 'VALIDATION_FAILED' }));

    await POST(loginRequest({ email: 'a@b.co' }));

    expect(mockLoginAdmin).toHaveBeenCalledWith('a@b.co', '');
  });

  it('answers a catalog VALIDATION_FAILED body of its own when the request is not JSON', async () => {
    const response = await POST(new Request('http://localhost/api/auth/login', { method: 'POST', body: 'not json' }));

    expect(response.status).toBe(HTTP_BAD_REQUEST);
    await expect(response.json()).resolves.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(mockLoginAdmin).not.toHaveBeenCalled();
  });

  it('answers INTERNAL_ERROR when the API body is not a coded contract', async () => {
    mockLoginAdmin.mockRejectedValue(new AdminLoginError(502, null));

    const response = await POST(loginRequest({ email: 'a@b.co', password: 'secret' }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ code: 'INTERNAL_ERROR' });
  });
});
