import { Platform } from "react-native";

const defaultApiBaseUrl =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

function readPublicEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export const env = {
  apiBaseUrl: readPublicEnv("EXPO_PUBLIC_API_URL") ?? defaultApiBaseUrl,
  googleWebClientId: readPublicEnv("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"),
};

export function getGoogleWebClientId(): string {
  if (!env.googleWebClientId) {
    throw new Error("Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID");
  }

  return env.googleWebClientId;
}
