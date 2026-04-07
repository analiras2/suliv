import { describe, it, expect, beforeAll, vi } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../jwt.js";

beforeAll(() => {
  process.env.JWT_SECRET = "test-access-secret-32-chars-long!!";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-32-chars-long!";
});

describe("signAccessToken / verifyAccessToken", () => {
  it("roundtrip: signs and verifies a valid access token", async () => {
    const payload = { sub: "user-123", email: "ana@example.com" };
    const token = await signAccessToken(payload);
    const verified = await verifyAccessToken(token);

    expect(verified.sub).toBe("user-123");
    expect(verified.email).toBe("ana@example.com");
  });

  it("throws on a tampered access token", async () => {
    const token = await signAccessToken({ sub: "user-123" });
    const tampered = token.slice(0, -5) + "XXXXX";

    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });

  it("throws on an expired access token", async () => {
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const expiredToken = await new SignJWT({ sub: "user-123" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1800)
      .sign(secret);

    await expect(verifyAccessToken(expiredToken)).rejects.toThrow();
  });
});

describe("signRefreshToken / verifyRefreshToken", () => {
  it("roundtrip: signs and verifies a valid refresh token", async () => {
    const token = await signRefreshToken("user-456");
    const { userId } = await verifyRefreshToken(token);

    expect(userId).toBe("user-456");
  });

  it("throws on a tampered refresh token", async () => {
    const token = await signRefreshToken("user-456");
    const tampered = token.slice(0, -5) + "XXXXX";

    await expect(verifyRefreshToken(tampered)).rejects.toThrow();
  });

  it("throws on an expired refresh token", async () => {
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);
    const expiredToken = await new SignJWT({ sub: "user-456" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(secret);

    await expect(verifyRefreshToken(expiredToken)).rejects.toThrow();
  });
});
