import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/atoms/button';
import { FormField } from '@/components/molecules/form-field';
import { SettingsHeader } from '@/components/molecules/settings-header';
import { layout, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useUsernameViewModel } from '@/module/profile/viewModels/use-username-view-model';

export function SettingsUsernameScreen() {
  const router = useRouter();
  const { username, setUsername, status, error, fieldErrors, submit } = useUsernameViewModel();
  const fieldError = fieldErrors.username ?? error;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SettingsHeader onBack={router.back} title="Nome de usuário" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>
          Use de 3 a 20 caracteres, com letras, números, _ ou . Você só pode trocar a cada 30 dias.
        </Text>
        <FormField
          label="Nome de usuário"
          onChangeText={setUsername}
          placeholder="seu_nome"
          testID="settings-username-input"
          value={username}
        />
        {fieldError ? (
          <Text accessibilityRole="alert" style={styles.error} testID="settings-username-error">
            {fieldError}
          </Text>
        ) : null}
        <Button onPress={() => void submit()} testID="settings-username-save">
          {status === 'submitting' ? 'Salvando…' : 'Salvar'}
        </Button>
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
    gap: spacing.md,
    paddingHorizontal: layout.screenGutter,
    paddingBottom: layout.tabBarClearance,
  },
  hint: {
    ...typography.bodyMd,
    color: semanticColors.fgSecondary,
  },
  error: {
    ...typography.bodyMd,
    color: semanticColors.danger,
  },
});
