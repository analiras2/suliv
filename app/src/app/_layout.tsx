import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SplashErrorView } from '@/components/splash-error-view';
import { semanticColors } from '@/design-system/tokens';
import { useSulivFonts } from '@/design-system/fonts';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import { useSessionViewModel } from '@/module/auth/view-models/use-session-view-model';
import { OfflineModeProvider } from '@/module/splash/context/offline-mode-context';
import { useSplashViewModel } from '@/module/splash/viewModels/use-splash-view-model';

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

export default function RootLayout() {
  const [fontsLoaded] = useSulivFonts();
  useSessionViewModel();
  const splash = useSplashViewModel();
  const sessionStatus = useSessionStore((state) => state.status);

  if (!fontsLoaded || splash.status === 'loading') {
    return null;
  }

  // A live sign-out/account-deletion (session status flips to `unauthenticated` after the
  // splash decision was already made) must force the (auth) group back on, otherwise the
  // Stack keeps the group the initial splash resolved to and (auth) never remounts.
  const activeRoute = sessionStatus === 'unauthenticated' ? '(auth)' : splash.initialRoute;

  if (splash.status === 'error') {
    return (
      <SafeAreaProvider>
        <ThemeProvider value={sulivTheme}>
          <SplashErrorView onRetry={splash.retry} />
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
