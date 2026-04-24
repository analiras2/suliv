import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  InterTight_400Regular,
  InterTight_400Regular_Italic,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
} from "@expo-google-fonts/inter-tight";
import {
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from "@expo-google-fonts/instrument-serif";
import * as SplashScreen from "expo-splash-screen";
import { AuthNavigator } from "./src/navigation/AuthNavigator";
import { env } from "./src/config/env";
import { configureAuthApi } from "./src/services/authApi";
import { configureGoogleSignIn } from "./src/services/socialAuth";

SplashScreen.preventAutoHideAsync();

configureAuthApi(env.apiBaseUrl);
configureGoogleSignIn();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    InterTight_400Regular,
    InterTight_400Regular_Italic,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold,
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <AuthNavigator />
    </SafeAreaProvider>
  );
}
