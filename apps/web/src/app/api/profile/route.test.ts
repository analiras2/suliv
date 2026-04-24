import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "./route.js";

// ── auth-middleware mock ──────────────────────────────────────────────────────
const { mockRequireAuth, MockAuthError } = vi.hoisted(() => {
  class MockAuthError extends Error {
    readonly status = 401 as const;
    constructor(msg: string) {
      super(msg);
      this.name = "AuthError";
    }
  }
  return { mockRequireAuth: vi.fn(), MockAuthError };
});
vi.mock("../../../lib/auth-middleware", () => ({
  requireAuth: mockRequireAuth,
  AuthError: MockAuthError,
}));

// ── @suliv/db mock ────────────────────────────────────────────────────────────
const mockUserProfile = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@suliv/db", () => ({ prisma: { userProfile: mockUserProfile } }));

// ── helpers ───────────────────────────────────────────────────────────────────
function makeReq(
  method: string,
  body?: unknown,
  authHeader = "Bearer valid.token"
) {
  return new Request(`http://localhost/api/profile`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

const fakeProfile = {
  id: "profile-1",
  userId: "user-1",
  dietaryRestrictions: [],
  allergens: [],
  preferredCuisines: [],
  skillLevel: null,
  avgCookTimeMin: null,
  householdSize: null,
  onboardingCompleted: true,
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ userId: "user-1" });
});

// ── GET /api/profile ──────────────────────────────────────────────────────────
describe("GET /api/profile", () => {
  it("200 — retorna o perfil do usuário autenticado", async () => {
    mockUserProfile.findUnique.mockResolvedValueOnce(fakeProfile);

    const res = await GET(makeReq("GET") as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.userId).toBe("user-1");
  });

  it("401 — sem token", async () => {
    mockRequireAuth.mockRejectedValueOnce(new MockAuthError("no token"));

    const res = await GET(makeReq("GET", undefined, "") as any);
    expect(res.status).toBe(401);
  });

  it("404 — perfil não existe (onboarding não concluído)", async () => {
    mockUserProfile.findUnique.mockResolvedValueOnce(null);

    const res = await GET(makeReq("GET") as any);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("profile_not_found");
  });
});

// ── PATCH /api/profile ────────────────────────────────────────────────────────
describe("PATCH /api/profile", () => {
  it("200 — atualiza campos parcialmente", async () => {
    mockUserProfile.findUnique.mockResolvedValueOnce(fakeProfile);
    const updated = { ...fakeProfile, allergens: ["gluten"] };
    mockUserProfile.update.mockResolvedValueOnce(updated);

    const res = await PATCH(
      makeReq("PATCH", { allergens: ["gluten"] }) as any
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.allergens).toEqual(["gluten"]);

    expect(mockUserProfile.update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { allergens: ["gluten"] },
    });
  });

  it("200 — objeto vazio é válido (PATCH parcial)", async () => {
    mockUserProfile.findUnique.mockResolvedValueOnce(fakeProfile);
    mockUserProfile.update.mockResolvedValueOnce(fakeProfile);

    const res = await PATCH(makeReq("PATCH", {}) as any);
    expect(res.status).toBe(200);
  });

  it("401 — sem token", async () => {
    mockRequireAuth.mockRejectedValueOnce(new MockAuthError("no token"));

    const res = await PATCH(makeReq("PATCH", {}, "") as any);
    expect(res.status).toBe(401);
  });

  it("404 — perfil não existe", async () => {
    mockUserProfile.findUnique.mockResolvedValueOnce(null);

    const res = await PATCH(makeReq("PATCH", { name: "Ana" }) as any);
    expect(res.status).toBe(404);
  });

  it("422 — avatarUrl inválida", async () => {
    const res = await PATCH(
      makeReq("PATCH", { avatarUrl: "nao-e-url" }) as any
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("validation_error");
  });

  it("GET após PATCH reflete o campo atualizado", async () => {
    // PATCH
    mockUserProfile.findUnique.mockResolvedValueOnce(fakeProfile);
    const updated = { ...fakeProfile, allergens: ["gluten"] };
    mockUserProfile.update.mockResolvedValueOnce(updated);
    await PATCH(makeReq("PATCH", { allergens: ["gluten"] }) as any);

    // GET
    mockUserProfile.findUnique.mockResolvedValueOnce(updated);
    const res = await GET(makeReq("GET") as any);
    const body = await res.json();
    expect(body.profile.allergens).toEqual(["gluten"]);
  });
});
