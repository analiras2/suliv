import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveTokens, getTokens, clearTokens } from "../tokenStorage.js";

const store: Record<string, string> = {};

vi.mock("react-native-keychain", () => ({
  ACCESSIBLE: { WHEN_UNLOCKED: "WhenUnlocked" },
  setGenericPassword: vi.fn(
    async (_username: string, password: string, options: { service: string }) => {
      store[options.service] = password;
      return true;
    }
  ),
  getGenericPassword: vi.fn(async (options: { service: string }) => {
    const password = store[options.service];
    if (password === undefined) return false;
    return { username: "tokens", password };
  }),
  resetGenericPassword: vi.fn(async (options: { service: string }) => {
    delete store[options.service];
    return true;
  }),
}));

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.clearAllMocks();
});

describe("saveTokens / getTokens", () => {
  it("roundtrip: saves and retrieves the same token pair", async () => {
    const tokens = { accessToken: "access-abc", refreshToken: "refresh-xyz" };
    await saveTokens(tokens);
    const result = await getTokens();

    expect(result).toEqual(tokens);
  });

  it("returns null when no tokens are stored", async () => {
    const result = await getTokens();
    expect(result).toBeNull();
  });

  it("overwrites tokens on a second save", async () => {
    await saveTokens({ accessToken: "old-access", refreshToken: "old-refresh" });
    await saveTokens({ accessToken: "new-access", refreshToken: "new-refresh" });
    const result = await getTokens();

    expect(result).toEqual({ accessToken: "new-access", refreshToken: "new-refresh" });
  });
});

describe("clearTokens", () => {
  it("clears stored tokens — getTokens returns null afterwards", async () => {
    await saveTokens({ accessToken: "access-abc", refreshToken: "refresh-xyz" });
    await clearTokens();
    const result = await getTokens();

    expect(result).toBeNull();
  });

  it("is safe to call when no tokens are stored", async () => {
    await expect(clearTokens()).resolves.not.toThrow();
  });
});
