import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { semanticColors } from '@/design-system/tokens';
import { useSulivFonts } from '@/design-system/fonts';

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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={sulivTheme}>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="recipe/[id]" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
