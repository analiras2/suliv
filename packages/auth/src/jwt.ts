import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export interface JwtPayload {
  sub: string;
  email?: string;
  [key: string]: unknown;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function getSecret(envVar: string): Uint8Array {
  const value = process.env[envVar];
  if (!value) throw new Error(`Missing env var: ${envVar}`);
  return new TextEncoder().encode(value);
}

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret("JWT_SECRET"));
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret("JWT_REFRESH_SECRET"));
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecret("JWT_SECRET"));
  return payload as JwtPayload;
}

export async function verifyRefreshToken(
  token: string
): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, getSecret("JWT_REFRESH_SECRET"));
  if (!payload.sub) throw new Error("Missing sub in refresh token");
  return { userId: payload.sub };
}
