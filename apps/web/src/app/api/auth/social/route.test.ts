import { describe, it, expect, vi, beforeEach } from "vitest"

// --- google-auth-library mock ---
const mockVerifyIdToken = vi.hoisted(() => vi.fn())
vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}))

// --- apple-signin-auth mock ---
const mockAppleVerify = vi.hoisted(() => vi.fn())
vi.mock("apple-signin-auth", () => ({ default: { verifyIdToken: mockAppleVerify } }))

// --- @suliv/auth mock ---
const mockSignAccessToken = vi.hoisted(() => vi.fn())
const mockSignRefreshToken = vi.hoisted(() => vi.fn())

vi.mock("@suliv/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@suliv/auth")>()
  return {
    ...actual,
    signAccessToken: mockSignAccessToken,
    signRefreshToken: mockSignRefreshToken,
  }
})

// --- @suliv/db mock ---
const mockPrisma = vi.hoisted(() => ({
  account: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
  },
}))

vi.mock("@suliv/db", () => ({ prisma: mockPrisma }))

import { POST } from "./route"

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/social", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const GOOGLE_PAYLOAD = {
  sub: "google-sub-123",
  email: "google@example.com",
  name: "Google User",
}

const APPLE_PAYLOAD = {
  sub: "apple-sub-456",
  email: "apple@example.com",
}

describe("POST /api/auth/social", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignAccessToken.mockResolvedValue("access-token-abc")
    mockSignRefreshToken.mockResolvedValue("refresh-token-xyz")
    mockPrisma.refreshToken.create.mockResolvedValue({})
    mockPrisma.account.create.mockResolvedValue({})
  })

  it("201 Google — creates new user and account, returns tokens and is_new_user=true", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => GOOGLE_PAYLOAD,
    })

    mockPrisma.account.findUnique.mockResolvedValue(null)
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: "user-new-1",
      email: GOOGLE_PAYLOAD.email,
      name: GOOGLE_PAYLOAD.name,
      profile: { onboardingCompleted: false },
    })

    const req = makeRequest({ provider: "google", id_token: "valid-google-token" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json).toMatchObject({
      access_token: "access-token-abc",
      refresh_token: "refresh-token-xyz",
      user: { id: "user-new-1", email: GOOGLE_PAYLOAD.email, name: GOOGLE_PAYLOAD.name },
      is_new_user: true,
      has_profile: false,
    })

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: GOOGLE_PAYLOAD.email,
          name: GOOGLE_PAYLOAD.name,
          profile: { create: { onboardingCompleted: false } },
        }),
      })
    )
    expect(mockPrisma.account.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-new-1",
          provider: "google",
          providerAccountId: GOOGLE_PAYLOAD.sub,
        }),
      })
    )
    expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-new-1",
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      })
    )

    const { data } = mockPrisma.refreshToken.create.mock.calls[0][0]
    expect(data.tokenHash).not.toBe("refresh-token-xyz")
  })

  it("200 Google — existing account found, returns tokens and is_new_user=false", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => GOOGLE_PAYLOAD,
    })

    const existingUser = {
      id: "user-existing-2",
      email: GOOGLE_PAYLOAD.email,
      name: GOOGLE_PAYLOAD.name,
      profile: { onboardingCompleted: true },
    }

    mockPrisma.account.findUnique.mockResolvedValue({
      user: existingUser,
    })

    const req = makeRequest({ provider: "google", id_token: "valid-google-token" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toMatchObject({
      access_token: "access-token-abc",
      refresh_token: "refresh-token-xyz",
      user: { id: "user-existing-2", email: GOOGLE_PAYLOAD.email },
      is_new_user: false,
      has_profile: true,
    })

    expect(mockPrisma.user.create).not.toHaveBeenCalled()
    expect(mockPrisma.account.create).not.toHaveBeenCalled()
  })

  it("200 Apple — valid token, existing user linked by email, returns is_new_user=false", async () => {
    mockAppleVerify.mockResolvedValue(APPLE_PAYLOAD)

    mockPrisma.account.findUnique.mockResolvedValue(null)
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-apple-3",
      email: APPLE_PAYLOAD.email,
      name: null,
      profile: { onboardingCompleted: false },
    })

    const req = makeRequest({ provider: "apple", id_token: "valid-apple-token" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toMatchObject({
      user: { id: "user-apple-3", email: APPLE_PAYLOAD.email },
      is_new_user: false,
      has_profile: false,
    })

    expect(mockPrisma.user.create).not.toHaveBeenCalled()
    expect(mockPrisma.account.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-apple-3",
          provider: "apple",
          providerAccountId: APPLE_PAYLOAD.sub,
        }),
      })
    )
  })

  it("401 Google — invalid token throws exception, returns invalid_token", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("Token verification failed"))

    const req = makeRequest({ provider: "google", id_token: "invalid-google-token" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: "invalid_token" })

    expect(mockPrisma.account.findUnique).not.toHaveBeenCalled()
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
  })

  it("401 Apple — invalid token throws exception, returns invalid_token", async () => {
    mockAppleVerify.mockRejectedValue(new Error("Apple token verification failed"))

    const req = makeRequest({ provider: "apple", id_token: "invalid-apple-token" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: "invalid_token" })
  })

  it("422 — returns validation_error for invalid body (missing provider)", async () => {
    const req = makeRequest({ id_token: "some-token" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error).toBe("validation_error")
    expect(json.details).toBeDefined()
    expect(json.details.fieldErrors.provider).toBeDefined()
  })

  it("422 — returns validation_error for invalid body (unknown provider)", async () => {
    const req = makeRequest({ provider: "facebook", id_token: "some-token" })
    const res = await POST(req as any)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error).toBe("validation_error")
    expect(json.details.fieldErrors.provider).toBeDefined()
  })
})
