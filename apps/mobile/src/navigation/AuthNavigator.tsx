import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../features/auth/store/authStore";
import { LoginScreen } from "../features/auth/screens/LoginScreen";
import { RegisterScreen } from "../features/auth/screens/RegisterScreen";
import { OnboardingScreen } from "../features/auth/screens/OnboardingScreen";
import { SplashScreen } from "./SplashScreen";
import { FeedScreen } from "../features/recipes/screens/FeedScreen";
import { RecipeDetailScreen } from "../features/recipes/screens/RecipeDetailScreen";
import type { AuthStackParamList, AppStackParamList } from "./types";

// ---------------------------------------------------------------------------
// Stacks
// ---------------------------------------------------------------------------

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

const AppStack = createNativeStackNavigator<AppStackParamList>();

function AppStackNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Feed" component={FeedScreen} />
      <AppStack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
    </AppStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Root Navigator — driven entirely by auth state
// No conditional rendering tricks: use a single navigator with conditional
// initial screen to avoid white-flash between navigation state changes.
// ---------------------------------------------------------------------------

type RootStack = {
  Splash: undefined;
  Auth: undefined;
  Onboarding: undefined;
  App: undefined;
};

const Root = createNativeStackNavigator<RootStack>();

export function AuthNavigator() {
  const { isLoading, isAuthenticated, user, initialize } = useAuthStore();

  // Called exactly once on mount — restores session or clears state
  useEffect(() => {
    initialize();
  }, []);

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
        {isLoading ? (
          // While initialize() is running — show splash, no flash
          <Root.Screen name="Splash" component={SplashScreen} />
        ) : !isAuthenticated ? (
          // Not logged in — Auth stack (Login + Register)
          <Root.Screen name="Auth" component={AuthStackNavigator} />
        ) : !user?.hasProfile ? (
          // Logged in but onboarding not completed
          <Root.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          // Fully authenticated + onboarded — recipe feature
          <Root.Screen name="App" component={AppStackNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
