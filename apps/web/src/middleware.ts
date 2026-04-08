import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET ?? "";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

export const config = {
  matcher: [
    "/feed/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
    "/recipes/:path*",
  ],
};

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const baseUrl = req.nextUrl.origin;

  const accessToken = req.cookies.get("suliv_access")?.value;

  let isAuthenticated = false;

  if (accessToken) {
    try {
      await jwtVerify(accessToken, getSecret());
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // Redirect unauthenticated users to /login
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", baseUrl);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
