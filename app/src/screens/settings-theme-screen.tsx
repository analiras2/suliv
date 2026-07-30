import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type IconName } from '@/components/atoms/icon';
import { OptionCard } from '@/components/molecules/option-card';
import { SettingsHeader } from '@/components/molecules/settings-header';
import { layout, semanticColors, spacing } from '@/design-system/tokens';
import type { ThemePreference } from '@/lib/theme-preference';
import { useSettingsViewModel } from '@/module/profile/viewModels/use-settings-view-model';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Claro', icon: 'sun' },
  { value: 'dark', label: 'Escuro', icon: 'star' },
  { value: 'system', label: 'Automático', icon: 'settings' },
];

export function SettingsThemeScreen() {
  const router = useRouter();
  const { themePreference, setThemePreference } = useSettingsViewModel();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SettingsHeader onBack={router.back} title="Tema" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.options}>
          {THEME_OPTIONS.map((option) => (
            <OptionCard
              accessibilityLabel={option.label}
              icon={option.icon}
              key={option.value}
              onPress={() => setThemePreference(option.value)}
              selected={themePreference === option.value}
              selectionMode="single"
              testID={`settings-theme-option-${option.value}`}
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
    gap: spacing.sm,
    paddingHorizontal: spacing.lg - 4,
    paddingBottom: layout.tabBarClearance,
  },
  options: {
    gap: spacing.sm,
  },
});
