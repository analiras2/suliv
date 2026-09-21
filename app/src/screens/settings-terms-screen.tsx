import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsHeader } from '@/components/molecules/settings-header';
import { layout, semanticColors, spacing, typography } from '@/design-system/tokens';
import { termsService } from '@/module/profile/services/terms-service';

export function SettingsTermsScreen() {
  const router = useRouter();
  const { data, isPending, error } = useQuery({
    queryKey: ['terms', 'current'],
    queryFn: () => termsService.getCurrentTerms(),
  });

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SettingsHeader onBack={router.back} title="Termos" />
      <ScrollView contentContainerStyle={styles.content}>
        {isPending ? <ActivityIndicator color={semanticColors.brand} testID="settings-terms-loading" /> : null}
        {error ? <Text style={styles.error}>Não foi possível carregar os termos.</Text> : null}
        {data ? (
          <>
            <Text style={styles.version} testID="settings-terms-version">
              Versão {data.version}
            </Text>
            <Text style={styles.url} testID="settings-terms-url">
              {data.url}
            </Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  content: {
    gap: spacing.sm,
    paddingHorizontal: layout.screenGutter,
    paddingBottom: layout.tabBarClearance,
  },
  version: {
    ...typography.bodyMd,
    color: semanticColors.fg,
  },
  url: {
    ...typography.bodySm,
    color: semanticColors.fgSecondary,
  },
  error: {
    ...typography.bodyMd,
    color: semanticColors.danger,
  },
});
