"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { setSessionCookies, clearSessionCookies } from "@/lib/session";
import { getBaseUrl } from "@/lib/auth-config";

const BASE_URL = getBaseUrl();

export async function loginAction(
  email: string,
  password: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = (await res.json()) as { error: string; details?: unknown };
    throw new Error(JSON.stringify({ error: data.error, details: data.details }));
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    has_profile: boolean;
  };

  await setSessionCookies({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });

  redirect(data.has_profile ? "/feed" : "/onboarding");
}

export async function registerAction(
  email: string,
  password: string,
  name?: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  if (!res.ok) {
    const data = (await res.json()) as { error: string; details?: unknown };
    throw new Error(JSON.stringify({ error: data.error, details: data.details }));
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
  };

  await setSessionCookies({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });

  redirect("/onboarding");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("suliv_access")?.value;

  if (accessToken) {
    try {
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      // Best-effort logout — clear cookies regardless
    }
  }

  await clearSessionCookies();
  redirect("/login");
}
