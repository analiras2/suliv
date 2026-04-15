import { verifyAccessToken } from "@suliv/auth";

/**
 * Minimal interface satisfied by NextRequest, Request, and test stubs.
 */
interface AuthRequest {
  headers: {
    get(name: string): string | null;
  };
  cookies?: {
    get(name: string): { value: string } | undefined;
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
  const cookieToken = req.cookies?.get("suliv_access")?.value;

  let token: string | undefined;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice("Bearer ".length);
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (!token) {
    throw new AuthError("Missing authentication token");
  }

  try {
    const payload = await verifyAccessToken(token);
    if (!payload.sub) throw new AuthError("Invalid token payload");
    return { userId: payload.sub };
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError("Invalid or expired token");
  }
}
