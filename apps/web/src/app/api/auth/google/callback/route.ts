import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { setSessionCookies } from "@/lib/session";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;

  // Validate state to prevent CSRF
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${BASE_URL}/login?error=oauth_failed`);
  }

  // Clear the state cookie
  cookieStore.delete("oauth_state");

  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/login?error=oauth_failed`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        code,
        redirect_uri: `${BASE_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${BASE_URL}/login?error=oauth_failed`);
    }

    const tokenData = (await tokenRes.json()) as { id_token?: string };
    const idToken = tokenData.id_token;

    if (!idToken) {
      return NextResponse.redirect(`${BASE_URL}/login?error=oauth_failed`);
    }

    // Call internal social auth endpoint
    const socialRes = await fetch(`${BASE_URL}/api/auth/social`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "google", id_token: idToken }),
    });

    if (!socialRes.ok) {
      return NextResponse.redirect(`${BASE_URL}/login?error=oauth_failed`);
    }

    const socialData = (await socialRes.json()) as {
      access_token: string;
      refresh_token: string;
      has_profile: boolean;
    };

    await setSessionCookies({
      accessToken: socialData.access_token,
      refreshToken: socialData.refresh_token,
    });

    const destination = socialData.has_profile ? "/feed" : "/onboarding";
    return NextResponse.redirect(`${BASE_URL}${destination}`);
  } catch {
    return NextResponse.redirect(`${BASE_URL}/login?error=oauth_failed`);
  }
}
