import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { buildErrorBody } from '@/lib/api-response-error';
import { ADMIN_API_URL, SESSION_COOKIE_NAME } from '@/lib/constants';

const HTTP_UNAUTHORIZED = 401;
const HTTP_SERVER_ERROR_MIN = 500;
const HTTP_INTERNAL_ERROR = 500;

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

async function forward(request: NextRequest, params: RouteParams['params']): Promise<NextResponse> {
  const { path } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(buildErrorBody(HTTP_UNAUTHORIZED, 'UNAUTHORIZED', 'Not authenticated'), {
      status: HTTP_UNAUTHORIZED,
    });
  }

  const targetUrl = `${ADMIN_API_URL}/admin/${path.join('/')}${request.nextUrl.search}`;
  const hasBody = request.method !== 'GET' && request.method !== 'DELETE';
  const body = hasBody ? await request.text() : undefined;

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body || undefined,
    cache: 'no-store',
  });

  const text = await response.text();
  if (!text) {
    return new NextResponse(null, { status: response.status });
  }
  try {
    return NextResponse.json(JSON.parse(text) as unknown, { status: response.status });
  } catch {
    // An answer that is not JSON (for example a gateway error page) is not a contract body to forward.
    if (response.status < HTTP_SERVER_ERROR_MIN) return new NextResponse(null, { status: response.status });
    return NextResponse.json(buildErrorBody(HTTP_INTERNAL_ERROR, 'INTERNAL_ERROR', 'Internal server error'), {
      status: HTTP_INTERNAL_ERROR,
    });
  }
}

export async function GET(request: NextRequest, context: RouteParams): Promise<NextResponse> {
  return forward(request, context.params);
}

export async function POST(request: NextRequest, context: RouteParams): Promise<NextResponse> {
  return forward(request, context.params);
}

export async function PATCH(request: NextRequest, context: RouteParams): Promise<NextResponse> {
  return forward(request, context.params);
}

export async function DELETE(request: NextRequest, context: RouteParams): Promise<NextResponse> {
  return forward(request, context.params);
}
