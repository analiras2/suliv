import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthNavigator } from "./src/navigation/AuthNavigator";
import { configureAuthApi } from "./src/services/authApi";

// Configure API base URL — replace with your server URL or env variable
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
configureAuthApi(API_BASE_URL);

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthNavigator />
    </SafeAreaProvider>
  );
}
