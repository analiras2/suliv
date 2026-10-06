/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

const mockCookieGet = jest.fn();
const mockFetch = jest.fn<Promise<Response>, [string, RequestInit?]>();

jest.mock('next/headers', () => ({
  cookies: async () => ({ get: (...args: unknown[]) => mockCookieGet(...args) }),
}));

const HTTP_CONFLICT = 409;
const HTTP_UNAUTHORIZED = 401;

function proxyContext(...path: string[]) {
  return { params: Promise.resolve({ path }) };
}

describe('admin proxy route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as unknown as typeof fetch;
    mockCookieGet.mockReturnValue({ value: 'admin-token' });
  });

  it('IT-022 forwards a coded API failure to the client with its status and body unchanged', async () => {
    const apiBody = { statusCode: HTTP_CONFLICT, code: 'ALLERGEN_TERM_DUPLICATE', message: 'A term already exists' };
    mockFetch.mockResolvedValue(new Response(JSON.stringify(apiBody), { status: HTTP_CONFLICT }));
    const request = new NextRequest('http://localhost/api/admin/allergens/a1/ingredient-terms', {
      method: 'POST',
      body: JSON.stringify({ term: 'leite' }),
    });

    const response = await POST(request, proxyContext('allergens', 'a1', 'ingredient-terms'));

    expect(response.status).toBe(HTTP_CONFLICT);
    await expect(response.json()).resolves.toEqual(apiBody);
    expect(mockFetch.mock.calls[0][1]).toMatchObject({ headers: expect.objectContaining({ Authorization: 'Bearer admin-token' }) });
  });

  it('answers a catalog UNAUTHORIZED body when there is no session cookie', async () => {
    mockCookieGet.mockReturnValue(undefined);

    const response = await GET(new NextRequest('http://localhost/api/admin/recipes'), proxyContext('recipes'));

    expect(response.status).toBe(HTTP_UNAUTHORIZED);
    await expect(response.json()).resolves.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('answers INTERNAL_ERROR instead of throwing when a 5xx answer is not JSON', async () => {
    mockFetch.mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }));

    const response = await GET(new NextRequest('http://localhost/api/admin/recipes'), proxyContext('recipes'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ code: 'INTERNAL_ERROR', message: 'Internal server error' });
  });
});
