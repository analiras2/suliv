import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../features/auth/store/authStore";
import { LoginScreen } from "../features/auth/screens/LoginScreen";
import { EmailLoginScreen } from "../features/auth/screens/EmailLoginScreen";
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
      <AuthStack.Screen name="EmailLogin" component={EmailLoginScreen} />
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
  const { isAuthenticated, user, initialize } = useAuthStore();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Called exactly once on mount — restores session or clears state
  useEffect(() => {
    let isMounted = true;

    initialize().finally(() => {
      if (isMounted) {
        setIsBootstrapping(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
        {isBootstrapping ? (
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
