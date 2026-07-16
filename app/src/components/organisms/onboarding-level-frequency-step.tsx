import { StyleSheet, Text, View } from 'react-native';

import { type IconName } from '@/components/atoms/icon';
import { OptionCard } from '@/components/molecules/option-card';
import { semanticColors, spacing, typography } from '@/design-system/tokens';
import type {
  CookingFrequency,
  CookingLevel,
} from '@/module/onboarding/services/onboarding-service';

export type OnboardingLevelFrequencyStepProps = {
  cookingLevel: CookingLevel | null;
  cookingFrequency: CookingFrequency | null;
  onSelectLevel: (value: CookingLevel) => void;
  onSelectFrequency: (value: CookingFrequency) => void;
};

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

export function OnboardingLevelFrequencyStep({
  cookingLevel,
  cookingFrequency,
  onSelectLevel,
  onSelectFrequency,
}: OnboardingLevelFrequencyStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <Text style={styles.title}>Qual é o seu nível na cozinha?</Text>
        <View style={styles.options}>
          {LEVEL_OPTIONS.map((option) => {
            const isSelected = cookingLevel === option.value;
            return (
              <OptionCard
                accessibilityLabel={option.label}
                icon={option.icon}
                key={option.value}
                onPress={() => onSelectLevel(option.value)}
                selected={isSelected}
                selectionMode="single"
                testID={`onboarding-level-option-${option.value}`}
                title={option.label}
              />
            );
          })}
        </View>
      </View>
      <View style={styles.group}>
        <Text style={styles.title}>Com que frequência você cozinha?</Text>
        <View style={styles.options}>
          {FREQUENCY_OPTIONS.map((option) => {
            const isSelected = cookingFrequency === option.value;
            return (
              <OptionCard
                accessibilityLabel={option.label}
                icon={option.icon}
                key={option.value}
                onPress={() => onSelectFrequency(option.value)}
                selected={isSelected}
                selectionMode="single"
                testID={`onboarding-frequency-option-${option.value}`}
                title={option.label}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  group: {
    gap: spacing.md,
  },
  title: {
    ...typography.labelMd,
    color: semanticColors.fg,
  },
  options: {
    gap: spacing.sm,
  },
});
