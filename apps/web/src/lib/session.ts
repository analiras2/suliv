import { cookies } from "next/headers";
import { verifyAccessToken } from "@suliv/auth";
import type { TokenPair } from "@suliv/auth";

const ACCESS_COOKIE = "suliv_access";
const REFRESH_COOKIE = "suliv_refresh";

export async function setSessionCookies({
  accessToken,
  refreshToken,
}: TokenPair): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  });

  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export async function getServerSession(): Promise<{
  userId: string;
  email: string;
} | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (accessToken) {
    try {
      const payload = await verifyAccessToken(accessToken);
      if (payload.sub && payload.email) {
        return { userId: payload.sub, email: payload.email as string };
      }
    } catch {
      // Access token invalid or expired — try refresh below
    }
  }

  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return null;
  }

  // Try to refresh the token pair
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      await clearSessionCookies();
      return null;
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
    };

    await setSessionCookies({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    });

    const payload = await verifyAccessToken(data.access_token);
    if (payload.sub && payload.email) {
      return { userId: payload.sub, email: payload.email as string };
    }

    return null;
  } catch {
    await clearSessionCookies();
    return null;
  }
}
