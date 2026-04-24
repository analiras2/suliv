import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Must be hoisted so vi.mock factories can reference them
const mockRequireAuth = vi.hoisted(() => vi.fn())
const mockUpsert = vi.hoisted(() => vi.fn())

vi.mock("../../../../lib/auth-middleware", () => ({
  requireAuth: mockRequireAuth,
  AuthError: class AuthError extends Error {
    readonly status = 401 as const
    constructor(message: string) {
      super(message)
      this.name = "AuthError"
    }
  },
}))

vi.mock("@suliv/db", () => ({
  prisma: {
    userProfile: {
      upsert: mockUpsert,
    },
  },
}))

// Import route AFTER mocks are set up
import { POST } from "./route"

function makeRequest(body: unknown, authHeader?: string): NextRequest {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (authHeader) headers["Authorization"] = authHeader

  return new NextRequest("http://localhost/api/profile/onboarding", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
}

const validBody = {
  dietaryRestrictions: ["vegan"],
  allergens: ["gluten"],
  skillLevel: "INTERMEDIATE" as const,
  avgCookTimeMin: 30,
  householdSize: 2,
  preferredCuisines: ["italian", "japanese"],
}

const mockProfile = {
  id: "cuid_123",
  userId: "user_abc",
  ...validBody,
  onboardingCompleted: true,
  updatedAt: new Date("2026-01-01T00:00:00Z"),
}

describe("POST /api/profile/onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("200 — salva onboarding com sucesso e retorna profile", async () => {
    mockRequireAuth.mockResolvedValueOnce({ userId: "user_abc" })
    mockUpsert.mockResolvedValueOnce(mockProfile)

    const req = makeRequest(validBody, "Bearer valid-token")
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.profile).toMatchObject({
      userId: "user_abc",
      onboardingCompleted: true,
      skillLevel: "INTERMEDIATE",
    })
    expect(mockUpsert).toHaveBeenCalledOnce()
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_abc" },
        update: expect.objectContaining({ onboardingCompleted: true }),
        create: expect.objectContaining({ userId: "user_abc", onboardingCompleted: true }),
      })
    )
  })

  it("200 — idempotente: chamado duas vezes sem erro", async () => {
    mockRequireAuth.mockResolvedValue({ userId: "user_abc" })
    mockUpsert.mockResolvedValue(mockProfile)

    const req1 = makeRequest(validBody, "Bearer valid-token")
    const res1 = await POST(req1)
    expect(res1.status).toBe(200)

    const req2 = makeRequest(validBody, "Bearer valid-token")
    const res2 = await POST(req2)
    expect(res2.status).toBe(200)

    expect(mockUpsert).toHaveBeenCalledTimes(2)
  })

  it("401 — token ausente: requireAuth lança AuthError", async () => {
    // Import AuthError class from the mocked module to throw an instance of it
    const { AuthError } = await import("../../../../lib/auth-middleware")
    mockRequireAuth.mockRejectedValueOnce(new AuthError("Missing or invalid Authorization header"))

    const req = makeRequest(validBody)
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: "unauthorized" })
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it("422 — body inválido: skillLevel inválido retorna validation_error", async () => {
    mockRequireAuth.mockResolvedValueOnce({ userId: "user_abc" })

    const invalidBody = {
      dietaryRestrictions: ["vegan"],
      allergens: [],
      skillLevel: "EXPERT", // invalid value
    }

    const req = makeRequest(invalidBody, "Bearer valid-token")
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error).toBe("validation_error")
    expect(json.details).toBeDefined()
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it("422 — body inválido: campos obrigatórios ausentes", async () => {
    mockRequireAuth.mockResolvedValueOnce({ userId: "user_abc" })

    const incompleteBody = {
      // missing dietaryRestrictions, allergens, skillLevel
      avgCookTimeMin: 30,
    }

    const req = makeRequest(incompleteBody, "Bearer valid-token")
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json.error).toBe("validation_error")
    expect(json.details.fieldErrors).toHaveProperty("dietaryRestrictions")
    expect(json.details.fieldErrors).toHaveProperty("allergens")
    expect(mockUpsert).not.toHaveBeenCalled()
  })
})
