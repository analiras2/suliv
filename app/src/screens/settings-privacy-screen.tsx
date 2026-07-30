import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsHeader } from '@/components/molecules/settings-header';
import { layout, semanticColors, spacing, typography } from '@/design-system/tokens';

export function SettingsPrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SettingsHeader onBack={router.back} title="Privacidade" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.body} testID="settings-privacy-body">
          Seus dados pessoais são usados apenas para personalizar sua experiência no Suliv — recomendações,
          preferências alimentares e alergias. Não compartilhamos suas informações com terceiros para fins
          publicitários. Você pode excluir sua conta e seus dados a qualquer momento em Perfil e configurações.
        </Text>
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
    paddingHorizontal: spacing.lg - 4,
    paddingBottom: layout.tabBarClearance,
  },
  body: {
    ...typography.bodyMd,
    color: semanticColors.fg,
  },
});
