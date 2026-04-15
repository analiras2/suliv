import { describe, it, expect, vi, beforeEach } from "vitest"

const mockVerifyRefreshToken = vi.hoisted(() => vi.fn())
const mockSignAccessToken = vi.hoisted(() => vi.fn())
const mockSignRefreshToken = vi.hoisted(() => vi.fn())

vi.mock("@suliv/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@suliv/auth")>()
  return {
    ...actual,
    verifyRefreshToken: mockVerifyRefreshToken,
    signAccessToken: mockSignAccessToken,
    signRefreshToken: mockSignRefreshToken,
  }
})

const mockPrisma = vi.hoisted(() => ({
  refreshToken: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}))

vi.mock("@suliv/db", () => ({ prisma: mockPrisma }))

import { POST } from "./route"

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const FUTURE_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
const PAST_DATE = new Date(Date.now() - 1000)

describe("POST /api/auth/refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("200 — rotação válida: retorna novo par de tokens", async () => {
    mockVerifyRefreshToken.mockResolvedValue({ userId: "user-123" })
    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      id: "token-id-1",
      userId: "user-123",
      tokenHash: expect.any(String),
      expiresAt: FUTURE_DATE,
      revokedAt: null,
    })
    mockPrisma.refreshToken.update.mockResolvedValue({})
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
      name: "User",
      profile: { onboardingCompleted: true },
    })
    mockSignAccessToken.mockResolvedValue("new-access-token")
    mockSignRefreshToken.mockResolvedValue("new-refresh-token")
    mockPrisma.refreshToken.create.mockResolvedValue({})

    const req = makeRequest({ refresh_token: "valid-refresh-token" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({
      access_token: "new-access-token",
      refresh_token: "new-refresh-token",
      user: { id: "user-123", email: "user@example.com", name: "User" },
      has_profile: true,
    })

    expect(mockVerifyRefreshToken).toHaveBeenCalledWith("valid-refresh-token")
    expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "token-id-1" },
        data: { revokedAt: expect.any(Date) },
      })
    )
    expect(mockSignAccessToken).toHaveBeenCalledWith({ sub: "user-123", email: "user@example.com" })
    expect(mockSignRefreshToken).toHaveBeenCalledWith("user-123")
    expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-123",
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      })
    )

    // tokenHash do novo token não deve ser o token em texto puro
    const { data } = mockPrisma.refreshToken.create.mock.calls[0][0]
    expect(data.tokenHash).not.toBe("new-refresh-token")
  })

  it("401 — usuário do refresh token não existe", async () => {
    mockVerifyRefreshToken.mockResolvedValue({ userId: "user-123" })
    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      id: "token-id-1",
      userId: "user-123",
      tokenHash: expect.any(String),
      expiresAt: FUTURE_DATE,
      revokedAt: null,
    })
    mockPrisma.refreshToken.update.mockResolvedValue({})
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const req = makeRequest({ refresh_token: "valid-refresh-token" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: "invalid_refresh_token" })
    expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled()
  })

  it("401 — token revogado (revokedAt != null): detecta reuse attack", async () => {
    mockVerifyRefreshToken.mockResolvedValue({ userId: "user-123" })
    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      id: "token-id-2",
      userId: "user-123",
      tokenHash: "some-hash",
      expiresAt: FUTURE_DATE,
      revokedAt: new Date(),
    })

    const req = makeRequest({ refresh_token: "revoked-token" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: "invalid_refresh_token" })
    expect(mockSignAccessToken).not.toHaveBeenCalled()
    expect(mockPrisma.refreshToken.update).not.toHaveBeenCalled()
  })

  it("401 — token não encontrado no banco", async () => {
    mockVerifyRefreshToken.mockResolvedValue({ userId: "user-123" })
    mockPrisma.refreshToken.findUnique.mockResolvedValue(null)

    const req = makeRequest({ refresh_token: "unknown-token" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: "invalid_refresh_token" })
    expect(mockSignAccessToken).not.toHaveBeenCalled()
  })

  it("401 — token expirado no banco (expiresAt no passado)", async () => {
    mockVerifyRefreshToken.mockResolvedValue({ userId: "user-123" })
    mockPrisma.refreshToken.findUnique.mockResolvedValue({
      id: "token-id-3",
      userId: "user-123",
      tokenHash: "some-hash",
      expiresAt: PAST_DATE,
      revokedAt: null,
    })

    const req = makeRequest({ refresh_token: "expired-db-token" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: "invalid_refresh_token" })
    expect(mockSignAccessToken).not.toHaveBeenCalled()
    expect(mockPrisma.refreshToken.update).not.toHaveBeenCalled()
  })

  it("401 — verifyRefreshToken lança (JWT inválido/expirado)", async () => {
    mockVerifyRefreshToken.mockRejectedValue(new Error("invalid jwt"))

    const req = makeRequest({ refresh_token: "malformed-jwt" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: "invalid_refresh_token" })
    expect(mockPrisma.refreshToken.findUnique).not.toHaveBeenCalled()
    expect(mockSignAccessToken).not.toHaveBeenCalled()
  })

  it("422 — body sem refresh_token", async () => {
    const req = makeRequest({})
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json).toEqual({ error: "validation_error" })
    expect(mockVerifyRefreshToken).not.toHaveBeenCalled()
  })
})
