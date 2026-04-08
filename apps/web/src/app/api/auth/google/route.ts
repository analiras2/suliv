import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(): Promise<NextResponse> {
  const state = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
