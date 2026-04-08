import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../features/auth/store/authStore.js";
import { LoginScreen } from "../features/auth/screens/LoginScreen.js";
import { RegisterScreen } from "../features/auth/screens/RegisterScreen.js";
import { OnboardingScreen } from "../features/auth/screens/OnboardingScreen.js";
import { SplashScreen } from "./SplashScreen.js";
import type { AuthStackParamList } from "./types.js";
import { tokens } from "@suliv/design-system";

// ---------------------------------------------------------------------------
// Placeholder Feed screen — replaced when Feed feature is implemented
// ---------------------------------------------------------------------------
import { StyleSheet, Text, View } from "react-native";

function FeedScreen() {
  return (
    <View style={feedStyles.container}>
      <Text style={feedStyles.text}>Feed 🌿</Text>
    </View>
  );
}

const feedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: tokens.typography.fontSizes.xl,
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeights.bold,
  },
});

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

// ---------------------------------------------------------------------------
// Root Navigator — driven entirely by auth state
// No conditional rendering tricks: use a single navigator with conditional
// initial screen to avoid white-flash between navigation state changes.
// ---------------------------------------------------------------------------

type RootStack = {
  Splash: undefined;
  Auth: undefined;
  Onboarding: undefined;
  Feed: undefined;
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
          // Fully authenticated + onboarded
          <Root.Screen name="Feed" component={FeedScreen} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
