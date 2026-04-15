import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { AuthNavigator } from "./src/navigation/AuthNavigator";
import { configureAuthApi } from "./src/services/authApi";

const defaultApiBaseUrl =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || defaultApiBaseUrl;

configureAuthApi(API_BASE_URL);

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthNavigator />
    </SafeAreaProvider>
  );
}
