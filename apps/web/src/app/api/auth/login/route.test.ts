import { describe, it, expect, vi, beforeEach } from "vitest"

const mockComparePassword = vi.hoisted(() => vi.fn())
const mockSignAccessToken = vi.hoisted(() => vi.fn())
const mockSignRefreshToken = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  refreshToken: { updateMany: vi.fn(), create: vi.fn() },
}))

vi.mock("@suliv/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@suliv/auth")>()
  return {
    ...actual,
    comparePassword: mockComparePassword,
    signAccessToken: mockSignAccessToken,
    signRefreshToken: mockSignRefreshToken,
  }
})

vi.mock("@suliv/db", () => ({ prisma: mockPrisma }))

import { POST } from "./route"

const VALID_USER = {
  id: "user_cuid_1",
  email: "ana@test.com",
  name: "Ana",
  passwordHash: "hashed_password",
  profile: { onboardingCompleted: true },
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignAccessToken.mockResolvedValue("mock_access_token")
    mockSignRefreshToken.mockResolvedValue("mock_refresh_token")
    mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 0 })
    mockPrisma.refreshToken.create.mockResolvedValue({})
  })

  it("returns 200 with tokens and has_profile: true when credentials are valid and onboarding completed", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(VALID_USER)
    mockComparePassword.mockResolvedValue(true)

    const req = makeRequest({ email: "ana@test.com", password: "Passw0rd!@#" })
    const res = await POST(req as any)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.access_token).toBe("mock_access_token")
    expect(data.refresh_token).toBe("mock_refresh_token")
    expect(data.user).toEqual({ id: VALID_USER.id, email: VALID_USER.email, name: VALID_USER.name })
    expect(data.has_profile).toBe(true)
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: VALID_USER.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    })
    expect(mockPrisma.refreshToken.create).toHaveBeenCalled()
  })

  it("returns 200 with has_profile: false when onboardingCompleted is false", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...VALID_USER,
      profile: { onboardingCompleted: false },
    })
    mockComparePassword.mockResolvedValue(true)

    const req = makeRequest({ email: "ana@test.com", password: "Passw0rd!@#" })
    const res = await POST(req as any)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.has_profile).toBe(false)
  })

  it("returns 401 when email is not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const req = makeRequest({ email: "notfound@test.com", password: "Passw0rd!@#" })
    const res = await POST(req as any)
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data).toEqual({ error: "invalid_credentials" })
    expect(mockComparePassword).not.toHaveBeenCalled()
  })

  it("returns 401 when password is incorrect", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(VALID_USER)
    mockComparePassword.mockResolvedValue(false)

    const req = makeRequest({ email: "ana@test.com", password: "wrong_password" })
    const res = await POST(req as any)
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data).toEqual({ error: "invalid_credentials" })
    expect(mockPrisma.refreshToken.updateMany).not.toHaveBeenCalled()
  })

  it("returns 422 when body is invalid", async () => {
    const req = makeRequest({ email: "not-an-email", password: "" })
    const res = await POST(req as any)
    const data = await res.json()

    expect(res.status).toBe(422)
    expect(data.error).toBe("validation_error")
    expect(data.details).toBeDefined()
    expect(data.details.fieldErrors).toBeDefined()
  })
})
