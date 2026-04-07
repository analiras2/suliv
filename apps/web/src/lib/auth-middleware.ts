import { verifyAccessToken } from "@suliv/auth";

/**
 * Minimal interface satisfied by NextRequest, Request, and test stubs.
 */
interface AuthRequest {
  headers: {
    get(name: string): string | null;
  };
}

export class AuthError extends Error {
  readonly status = 401 as const;

  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Extracts and verifies the Bearer token from the Authorization header.
 * Returns `{ userId }` on success.
 * Throws `AuthError` (status 401) if the header is missing, malformed,
 * expired, or tampered.
 */
export async function requireAuth(
  req: AuthRequest
): Promise<{ userId: string }> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing or invalid Authorization header");
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = await verifyAccessToken(token);
    if (!payload.sub) throw new AuthError("Invalid token payload");
    return { userId: payload.sub };
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError("Invalid or expired token");
  }
}
