import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type IconName } from '@/components/atoms/icon';
import { OptionCard } from '@/components/molecules/option-card';
import { SettingsHeader } from '@/components/molecules/settings-header';
import { layout, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useSettingsViewModel } from '@/module/profile/viewModels/use-settings-view-model';
import type { DietPreference } from '@/module/onboarding/services/onboarding-service';

const DIET_OPTIONS: { value: DietPreference; label: string; subtitle: string; icon: IconName }[] = [
  { value: 'vegano', label: 'Vegano', subtitle: 'Sem ingredientes de origem animal.', icon: 'vegan' },
  {
    value: 'vegetariano',
    label: 'Vegetariano',
    subtitle: 'Sem carne, com possibilidade de ovos e laticínios.',
    icon: 'vegetarian',
  },
  {
    value: 'flexitariano',
    label: 'Flexitariano',
    subtitle: 'Alimentação flexível, com interesse em receitas mais conscientes.',
    icon: 'flexitarian',
  },
];

export function SettingsDietScreen() {
  const router = useRouter();
  const { user, error, updateDietPreference } = useSettingsViewModel();
  const [selected, setSelected] = useState<DietPreference | null>(user?.dietPreference ?? null);

  function handleSelect(value: DietPreference) {
    setSelected(value);
    void updateDietPreference(value);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SettingsHeader onBack={router.back} title="Estilo alimentar" />
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.options}>
          {DIET_OPTIONS.map((option) => (
            <OptionCard
              accessibilityLabel={option.label}
              icon={option.icon}
              key={option.value}
              onPress={() => handleSelect(option.value)}
              selected={selected === option.value}
              selectionMode="single"
              subtitle={option.subtitle}
              testID={`settings-diet-option-${option.value}`}
              title={option.label}
            />
          ))}
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
    gap: spacing.md,
    paddingHorizontal: spacing.lg - 4,
    paddingBottom: layout.tabBarClearance,
  },
  options: {
    gap: spacing.sm,
  },
  error: {
    ...typography.bodyMd,
    color: semanticColors.danger,
  },
});
