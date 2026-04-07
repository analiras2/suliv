import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth, AuthError } from "../lib/auth-middleware.js";

const mockVerifyAccessToken = vi.hoisted(() => vi.fn());

vi.mock("@suliv/auth", () => ({
  verifyAccessToken: mockVerifyAccessToken,
}));

function makeRequest(authHeader?: string): { headers: { get: (k: string) => string | null } } {
  return {
    headers: {
      get: (key: string) =>
        key.toLowerCase() === "authorization" ? (authHeader ?? null) : null,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAuth", () => {
  it("retorna userId quando o token é válido", async () => {
    mockVerifyAccessToken.mockResolvedValueOnce({ sub: "user-abc", email: "ana@example.com" });

    const result = await requireAuth(makeRequest("Bearer valid.token.here"));

    expect(result).toEqual({ userId: "user-abc" });
    expect(mockVerifyAccessToken).toHaveBeenCalledWith("valid.token.here");
  });

  it("lança AuthError 401 quando não há header Authorization", async () => {
    await expect(requireAuth(makeRequest())).rejects.toThrow(AuthError);
    await expect(requireAuth(makeRequest())).rejects.toMatchObject({ status: 401 });
    expect(mockVerifyAccessToken).not.toHaveBeenCalled();
  });

  it("lança AuthError 401 quando o header não começa com Bearer", async () => {
    await expect(requireAuth(makeRequest("Basic dXNlcjpwYXNz"))).rejects.toThrow(AuthError);
    await expect(requireAuth(makeRequest("Basic dXNlcjpwYXNz"))).rejects.toMatchObject({ status: 401 });
    expect(mockVerifyAccessToken).not.toHaveBeenCalled();
  });

  it("lança AuthError 401 quando o token está expirado", async () => {
    mockVerifyAccessToken.mockRejectedValueOnce(new Error("JWTExpired"));

    await expect(requireAuth(makeRequest("Bearer expired.token"))).rejects.toThrow(AuthError);
    await expect(
      requireAuth(makeRequest("Bearer expired.token"))
    ).rejects.toMatchObject({ status: 401, message: "Invalid or expired token" });
  });

  it("lança AuthError 401 quando o token foi adulterado", async () => {
    mockVerifyAccessToken.mockRejectedValueOnce(new Error("JWTInvalid"));

    await expect(requireAuth(makeRequest("Bearer tampered.token"))).rejects.toThrow(AuthError);
    await expect(
      requireAuth(makeRequest("Bearer tampered.token"))
    ).rejects.toMatchObject({ status: 401 });
  });
});
