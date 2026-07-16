import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';

type VerTudoOrigin = 'categoria' | 'top_semana';

const ORIGIN_TITLES: Record<VerTudoOrigin, string> = {
  categoria: 'Categoria',
  top_semana: 'Top da semana',
};

export default function VerTudoScreen() {
  const { origin, categoryKey } = useLocalSearchParams<{ origin: VerTudoOrigin; categoryKey?: string }>();
  const title = ORIGIN_TITLES[origin] ?? 'Ver tudo';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title} testID="ver-tudo-title">
          {title}
        </Text>
        {categoryKey ? (
          <Text style={styles.subtitle} testID="ver-tudo-category-key">
            {categoryKey}
          </Text>
        ) : null}
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
    padding: spacing.lg,
  },
  title: {
    ...typography.displayXs,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
  },
  subtitle: {
    ...typography.bodyMd,
    color: semanticColors.fgSecondary,
  },
});
