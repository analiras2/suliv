import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBaseUrl, getGoogleClientId, sanitizeRedirectPath } from "@/lib/auth-config";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const state = crypto.randomUUID();
  const baseUrl = getBaseUrl();

  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/",
  });

  const redirectPath = sanitizeRedirectPath(req.nextUrl.searchParams.get("redirect"));
  if (redirectPath) {
    cookieStore.set("post_auth_redirect", redirectPath, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 10 * 60,
      path: "/",
    });
  }

  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: `${baseUrl}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
