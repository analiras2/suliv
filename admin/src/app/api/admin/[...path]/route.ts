import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_API_URL, SESSION_COOKIE_NAME } from '@/lib/constants';

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

async function forward(request: NextRequest, params: RouteParams['params']): Promise<NextResponse> {
  const { path } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
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
  return NextResponse.json(JSON.parse(text), { status: response.status });
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
