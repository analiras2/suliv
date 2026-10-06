import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { StateView } from '@/components/molecules/state-view';
import { semanticColors } from '@/design-system/tokens';
import { useSulivFonts } from '@/design-system/fonts';
import { STATE_COPY } from '@/lib/state-copy';
import { useSessionStore, type SessionStatus } from '@/module/auth/store/use-session-store';
import type { UserProfile } from '@/module/auth/types';
import { useSessionViewModel } from '@/module/auth/view-models/use-session-view-model';
import { OfflineModeProvider } from '@/module/splash/context/offline-mode-context';
import {
  useSplashViewModel,
  type InitialRoute,
} from '@/module/splash/viewModels/use-splash-view-model';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const sulivTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: semanticColors.bg,
    card: semanticColors.surface,
    text: semanticColors.fg,
    border: semanticColors.border,
    primary: semanticColors.brand,
  },
};

/**
 * The splash decides the initial group once, before any sign-in happens in this app run.
 * Every later transition of the session has to move the guard itself, or the Stack keeps
 * rendering the group the splash resolved to and `router.replace` has no mounted target:
 * a sign-out must bring (auth) back, and a sign-in must leave it — otherwise the user
 * stays on the login/complete-profile screen with the navigation call silently doing
 * nothing. While the profile is still loading (`user` is null) the splash answer stands —
 * but only for the session the splash inspected. After a sign-out that answer is stale: a
 * fresh sign-in becomes `authenticated` before its profile loads, and falling back to a
 * splash-time `(tabs)` would unmount the login screen mid-bootstrap.
 */
function resolveActiveRoute(
  sessionStatus: SessionStatus,
  user: UserProfile | null,
  initialRoute: InitialRoute,
  hasSignedOut: boolean,
): InitialRoute {
  if (sessionStatus === 'unauthenticated') return '(auth)';
  if (sessionStatus !== 'authenticated') return initialRoute;
  if (!user) return hasSignedOut ? '(auth)' : initialRoute;
  // complete-profile lives inside (auth), so a nameless profile must stay in that group.
  if (!user.name) return '(auth)';
  return user.onboardingCompletedAt === null ? '(onboarding)' : '(tabs)';
}

export default function RootLayout() {
  const [fontsLoaded] = useSulivFonts();
  useSessionViewModel();
  const splash = useSplashViewModel();
  const sessionStatus = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const [hasSignedOut, setHasSignedOut] = useState(false);

  // Derived during render (not in an effect) so the stale splash answer is never used for
  // even one frame after the session drops.
  if (sessionStatus === 'unauthenticated' && !hasSignedOut) {
    setHasSignedOut(true);
  }

  if (!fontsLoaded || splash.status === 'loading') {
    return null;
  }

  const activeRoute = resolveActiveRoute(sessionStatus, user, splash.initialRoute, hasSignedOut);

  if (splash.status === 'error') {
    return (
      <SafeAreaProvider>
        <ThemeProvider value={sulivTheme}>
          <SafeAreaView style={styles.splashErrorSafeArea}>
            <StateView
              illustrationIcon={STATE_COPY.splash_offline.illustrationIcon}
              title={STATE_COPY.splash_offline.title}
              description={STATE_COPY.splash_offline.description}
              primaryAction={{ label: STATE_COPY.splash_offline.primaryActionLabel, onPress: splash.retry }}
              testID="state-view-splash_offline"
            />
          </SafeAreaView>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <OfflineModeProvider isOffline={splash.status === 'offline'}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={sulivTheme}>
            <AnimatedSplashOverlay />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Protected guard={activeRoute === '(auth)'}>
                <Stack.Screen name="(auth)" />
              </Stack.Protected>
              <Stack.Protected guard={activeRoute === '(onboarding)'}>
                <Stack.Screen name="(onboarding)" />
              </Stack.Protected>
              <Stack.Protected guard={activeRoute === '(tabs)'}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="ver-tudo" />
              </Stack.Protected>
              {/* Recipe detail renders without an active session (ADR-002) — reachable via
                  deep link regardless of the auth gate above, unlike the rest of (tabs). */}
              <Stack.Screen name="recipe/[slug]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="recipe/[slug]/cook" options={{ presentation: 'modal' }} />
              <Stack.Screen name="r/[slug]" />
            </Stack>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </OfflineModeProvider>
  );
}

const styles = StyleSheet.create({
  splashErrorSafeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semanticColors.bg,
  },
});
