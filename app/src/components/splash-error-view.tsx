import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { semanticColors } from '@/design-system/tokens';

export interface SplashErrorViewProps {
  onRetry: () => void;
}

export function SplashErrorView({ onRetry }: SplashErrorViewProps) {
  return (
    <SafeAreaView style={styles.safeArea} testID="splash-error-view">
      <View style={styles.container}>
        <Text style={styles.message} testID="splash-error-message">
          Não foi possível carregar seus dados agora. Verifique sua conexão e tente novamente.
        </Text>
        <Pressable
          accessibilityLabel="Tentar novamente"
          accessibilityRole="button"
          onPress={onRetry}
          style={styles.button}
          testID="splash-error-retry-button">
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  message: {
    color: semanticColors.fg,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: semanticColors.brand,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: semanticColors.brandOn,
    fontSize: 16,
    fontWeight: '600',
  },
});
