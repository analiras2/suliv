import * as Keychain from "react-native-keychain";

const SERVICE = "suliv.tokens";
const USERNAME = "tokens";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function saveTokens(tokens: TokenPair): Promise<void> {
  await Keychain.setGenericPassword(USERNAME, JSON.stringify(tokens), {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
  });
}

export async function getTokens(): Promise<TokenPair | null> {
  const result = await Keychain.getGenericPassword({ service: SERVICE });
  if (result === false) return null;
  return JSON.parse(result.password) as TokenPair;
}

export async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
