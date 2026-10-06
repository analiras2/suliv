import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type IconName } from '@/components/atoms/icon';
import { OptionCard } from '@/components/molecules/option-card';
import { SettingsHeader } from '@/components/molecules/settings-header';
import { layout, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useSettingsViewModel } from '@/module/profile/viewModels/use-settings-view-model';
import type { CookingFrequency, CookingLevel } from '@/module/onboarding/services/onboarding-service';

const LEVEL_OPTIONS: { value: CookingLevel; label: string; icon: IconName }[] = [
  { value: 'iniciante', label: 'Iniciante', icon: 'sparkle' },
  { value: 'intermediario', label: 'Intermediário', icon: 'leaf' },
  { value: 'avancado', label: 'Avançado', icon: 'sun' },
];

const FREQUENCY_OPTIONS: { value: CookingFrequency; label: string; icon: IconName }[] = [
  { value: 'raramente', label: 'Raramente', icon: 'calendar' },
  { value: 'algumas_vezes_semana', label: 'Algumas vezes por semana', icon: 'clock' },
  { value: 'quase_todo_dia', label: 'Quase todo dia', icon: 'bell' },
];

export function SettingsLevelFrequencyScreen() {
  const router = useRouter();
  const { user, error, updateCookingLevel, updateCookingFrequency } = useSettingsViewModel();
  const [level, setLevel] = useState<CookingLevel | null>(user?.cookingLevel ?? null);
  const [frequency, setFrequency] = useState<CookingFrequency | null>(user?.cookingFrequency ?? null);

  function handleSelectLevel(value: CookingLevel) {
    setLevel(value);
    void updateCookingLevel(value);
  }

  function handleSelectFrequency(value: CookingFrequency) {
    setFrequency(value);
    void updateCookingFrequency(value);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SettingsHeader onBack={router.back} title="Nível e frequência" />
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Nível na cozinha</Text>
          <View style={styles.options}>
            {LEVEL_OPTIONS.map((option) => (
              <OptionCard
                accessibilityLabel={option.label}
                icon={option.icon}
                key={option.value}
                onPress={() => handleSelectLevel(option.value)}
                selected={level === option.value}
                selectionMode="single"
                testID={`settings-level-option-${option.value}`}
                title={option.label}
              />
            ))}
          </View>
        </View>
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Frequência</Text>
          <View style={styles.options}>
            {FREQUENCY_OPTIONS.map((option) => (
              <OptionCard
                accessibilityLabel={option.label}
                icon={option.icon}
                key={option.value}
                onPress={() => handleSelectFrequency(option.value)}
                selected={frequency === option.value}
                selectionMode="single"
                testID={`settings-frequency-option-${option.value}`}
                title={option.label}
              />
            ))}
          </View>
        </View>
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
    gap: spacing.lg,
    paddingHorizontal: layout.screenGutter,
    paddingBottom: layout.tabBarClearance,
  },
  group: {
    gap: spacing.md,
  },
  groupTitle: {
    ...typography.labelMd,
    color: semanticColors.fg,
  },
  options: {
    gap: spacing.sm,
  },
  error: {
    ...typography.bodyMd,
    color: semanticColors.danger,
  },
});
