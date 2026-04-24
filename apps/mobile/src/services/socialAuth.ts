import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { env, getGoogleWebClientId } from "../config/env";

export function configureGoogleSignIn() {
  if (!env.googleWebClientId) {
    return;
  }

  GoogleSignin.configure({
    webClientId: getGoogleWebClientId(),
    offlineAccess: true,
  });
}

export async function signInWithGoogle() {
  getGoogleWebClientId();
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const idToken = userInfo.data?.idToken;

  if (!idToken) {
    throw new Error("No ID token found");
  }

  return idToken;
}
