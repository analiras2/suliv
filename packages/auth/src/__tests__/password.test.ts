import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "../password.js";

describe("hashPassword", () => {
  it("returns a bcrypt hash (not the plain text)", async () => {
    const hash = await hashPassword("minhasenha1");
    expect(hash).not.toBe("minhasenha1");
    expect(hash).toMatch(/^\$2[ab]\$12\$/); // bcrypt cost factor 12
  });
});

describe("comparePassword", () => {
  it("returns true for correct password", async () => {
    const hash = await hashPassword("minhasenha1");
    await expect(comparePassword("minhasenha1", hash)).resolves.toBe(true);
  });

  it("returns false for wrong password", async () => {
    const hash = await hashPassword("minhasenha1");
    await expect(comparePassword("senhaerrada", hash)).resolves.toBe(false);
  });

  it("returns false (does not throw) for an invalid hash", async () => {
    await expect(comparePassword("qualquer", "nao-e-um-hash")).resolves.toBe(
      false
    );
  });
});
