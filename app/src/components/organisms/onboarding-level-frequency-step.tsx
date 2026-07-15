import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/atoms/pill';
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

const LEVEL_OPTIONS: { value: CookingLevel; label: string }[] = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
];

const FREQUENCY_OPTIONS: { value: CookingFrequency; label: string }[] = [
  { value: 'raramente', label: 'Raramente' },
  { value: 'algumas_vezes_semana', label: 'Algumas vezes por semana' },
  { value: 'quase_todo_dia', label: 'Quase todo dia' },
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
              <Pressable
                accessibilityLabel={option.label}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={option.value}
                onPress={() => onSelectLevel(option.value)}
                testID={`onboarding-level-option-${option.value}`}>
                <Pill tone={isSelected ? 'moss' : 'sand'} size="md">
                  {option.label}
                </Pill>
              </Pressable>
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
              <Pressable
                accessibilityLabel={option.label}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={option.value}
                onPress={() => onSelectFrequency(option.value)}
                testID={`onboarding-frequency-option-${option.value}`}>
                <Pill tone={isSelected ? 'moss' : 'sand'} size="md">
                  {option.label}
                </Pill>
              </Pressable>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
