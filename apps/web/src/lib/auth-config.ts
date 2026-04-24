const DEFAULT_BASE_URL = "http://localhost:3000";

export function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.EXPO_PUBLIC_API_URL ??
    DEFAULT_BASE_URL
  );
}

export function getGoogleClientId(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("Missing GOOGLE_CLIENT_ID");
  }

  return clientId;
}

export function getGoogleClientSecret(): string {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_SECRET");
  }

  return clientSecret;
}

export function sanitizeRedirectPath(redirect: string | null | undefined): string | null {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return null;
  }

  return redirect;
}
