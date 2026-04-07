import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  socialSchema,
  onboardingSchema,
  profileUpdateSchema,
} from "../validators.js";

describe("registerSchema", () => {
  it("aceita input válido", () => {
    expect(() =>
      registerSchema.parse({ email: "ana@example.com", password: "senha123" })
    ).not.toThrow();
  });

  it("aceita nome opcional", () => {
    expect(() =>
      registerSchema.parse({
        email: "ana@example.com",
        password: "senha123",
        name: "Ana",
      })
    ).not.toThrow();
  });

  it("rejeita e-mail inválido", () => {
    expect(() =>
      registerSchema.parse({ email: "naoemail", password: "senha123" })
    ).toThrow();
  });

  it("rejeita senha com menos de 8 caracteres", () => {
    expect(() =>
      registerSchema.parse({ email: "ana@example.com", password: "abc1" })
    ).toThrow();
  });

  it("rejeita senha sem número", () => {
    expect(() =>
      registerSchema.parse({ email: "ana@example.com", password: "senhasemnumero" })
    ).toThrow();
  });

  it("mensagem de erro em português para senha curta", () => {
    const result = registerSchema.safeParse({
      email: "ana@example.com",
      password: "abc1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? "";
      expect(msg).toMatch(/pelo menos 8/);
    }
  });
});

describe("loginSchema", () => {
  it("aceita input válido", () => {
    expect(() =>
      loginSchema.parse({ email: "ana@example.com", password: "senha123" })
    ).not.toThrow();
  });

  it("rejeita e-mail ausente", () => {
    expect(() => loginSchema.parse({ password: "senha123" })).toThrow();
  });

  it("rejeita senha vazia", () => {
    expect(() =>
      loginSchema.parse({ email: "ana@example.com", password: "" })
    ).toThrow();
  });
});

describe("socialSchema", () => {
  it("aceita Google", () => {
    expect(() =>
      socialSchema.parse({ provider: "google", id_token: "tok_abc" })
    ).not.toThrow();
  });

  it("aceita Apple", () => {
    expect(() =>
      socialSchema.parse({ provider: "apple", id_token: "tok_xyz" })
    ).not.toThrow();
  });

  it("rejeita provedor desconhecido", () => {
    expect(() =>
      socialSchema.parse({ provider: "facebook", id_token: "tok" })
    ).toThrow();
  });

  it("rejeita id_token vazio", () => {
    expect(() =>
      socialSchema.parse({ provider: "google", id_token: "" })
    ).toThrow();
  });
});

describe("onboardingSchema", () => {
  it("aceita input mínimo obrigatório", () => {
    expect(() =>
      onboardingSchema.parse({
        dietaryRestrictions: [],
        allergens: [],
        skillLevel: "BEGINNER",
      })
    ).not.toThrow();
  });

  it("aceita input completo com opcionais", () => {
    expect(() =>
      onboardingSchema.parse({
        dietaryRestrictions: ["vegano"],
        allergens: ["glúten"],
        skillLevel: "INTERMEDIATE",
        avgCookTimeMin: 30,
        householdSize: 2,
        preferredCuisines: ["italiana"],
      })
    ).not.toThrow();
  });

  it("rejeita skillLevel inválido", () => {
    expect(() =>
      onboardingSchema.parse({
        dietaryRestrictions: [],
        allergens: [],
        skillLevel: "EXPERT",
      })
    ).toThrow();
  });

  it("rejeita avgCookTimeMin negativo", () => {
    expect(() =>
      onboardingSchema.parse({
        dietaryRestrictions: [],
        allergens: [],
        skillLevel: "BEGINNER",
        avgCookTimeMin: -5,
      })
    ).toThrow();
  });
});

describe("profileUpdateSchema", () => {
  it("aceita objeto vazio (PATCH parcial)", () => {
    expect(() => profileUpdateSchema.parse({})).not.toThrow();
  });

  it("aceita qualquer subconjunto de campos", () => {
    expect(() =>
      profileUpdateSchema.parse({ name: "Ana", allergens: ["soja"] })
    ).not.toThrow();
  });

  it("rejeita avatarUrl malformada", () => {
    expect(() =>
      profileUpdateSchema.parse({ avatarUrl: "nao-e-uma-url" })
    ).toThrow();
  });
});
