import { describe, it, expect, vi, beforeEach } from "vitest"

const mockHashPassword = vi.hoisted(() => vi.fn())
const mockSignAccessToken = vi.hoisted(() => vi.fn())
const mockSignRefreshToken = vi.hoisted(() => vi.fn())

vi.mock("@suliv/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@suliv/auth")>()
  return {
    ...actual,
    hashPassword: mockHashPassword,
    signAccessToken: mockSignAccessToken,
    signRefreshToken: mockSignRefreshToken,
  }
})

const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn() },
  refreshToken: { create: vi.fn() },
}))

vi.mock("@suliv/db", () => ({ prisma: mockPrisma }))

import { POST } from "./route"

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("201 — creates user, profile and refresh token, returns tokens and user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    })
    mockHashPassword.mockResolvedValue("hashed-password")
    mockSignAccessToken.mockResolvedValue("access-token-abc")
    mockSignRefreshToken.mockResolvedValue("refresh-token-xyz")
    mockPrisma.refreshToken.create.mockResolvedValue({})

    const req = makeRequest({ email: "test@example.com", password: "password1!", name: "Test User" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json).toMatchObject({
      access_token: "access-token-abc",
      refresh_token: "refresh-token-xyz",
      user: { id: "user-123", email: "test@example.com", name: "Test User" },
      is_new_user: true,
    })

    expect(mockHashPassword).toHaveBeenCalledWith("password1!")
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "test@example.com",
          name: "Test User",
          passwordHash: "hashed-password",
          profile: { create: { onboardingCompleted: false } },
        }),
      })
    )
    expect(mockSignAccessToken).toHaveBeenCalledWith({ sub: "user-123", email: "test@example.com" })
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

    // tokenHash must NOT be the raw refresh token
    const { data } = mockPrisma.refreshToken.create.mock.calls[0][0]
    expect(data.tokenHash).not.toBe("refresh-token-xyz")
  })

  it("409 — returns email_taken when email already exists", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "existing-user" })

    const req = makeRequest({ email: "taken@example.com", password: "Passw0rd!@#" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json).toEqual({ error: "email_taken" })

    expect(mockPrisma.user.create).not.toHaveBeenCalled()
  })

  it("422 — returns validation_error for invalid email", async () => {
    const req = makeRequest({ email: "not-an-email", password: "Passw0rd!@#" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error).toBe("validation_error")
    expect(json.details).toBeDefined()
    expect(json.details.fieldErrors.email).toBeDefined()
  })

  it("422 — returns validation_error for password shorter than 6 characters", async () => {
    const req = makeRequest({ email: "test@example.com", password: "abc1" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error).toBe("validation_error")
    expect(json.details.fieldErrors.password).toBeDefined()
  })

  it("422 — returns validation_error for password without a number", async () => {
    const req = makeRequest({ email: "test@example.com", password: "PasswordNoDigit!" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error).toBe("validation_error")
    expect(json.details.fieldErrors.password).toBeDefined()
  })
})
