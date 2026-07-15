import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SplashErrorView } from '@/components/splash-error-view';
import { semanticColors } from '@/design-system/tokens';
import { useSulivFonts } from '@/design-system/fonts';
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

  if (!fontsLoaded || splash.status === 'loading') {
    return null;
  }

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
              <Stack.Protected guard={splash.initialRoute === '(auth)'}>
                <Stack.Screen name="(auth)" />
              </Stack.Protected>
              <Stack.Protected guard={splash.initialRoute === '(onboarding)'}>
                <Stack.Screen name="(onboarding)" />
              </Stack.Protected>
              <Stack.Protected guard={splash.initialRoute === '(tabs)'}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="recipe/[id]" options={{ presentation: 'modal' }} />
              </Stack.Protected>
            </Stack>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </OfflineModeProvider>
  );
}
