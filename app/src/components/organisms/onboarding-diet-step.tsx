import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/atoms/pill';
import { semanticColors, spacing, typography } from '@/design-system/tokens';
import type { DietPreference } from '@/module/onboarding/services/onboarding-service';

export type OnboardingDietStepProps = {
  dietPreference: DietPreference | null;
  onSelect: (value: DietPreference) => void;
};

const DIET_OPTIONS: { value: DietPreference; label: string }[] = [
  { value: 'vegano', label: 'Vegano' },
  { value: 'vegetariano', label: 'Vegetariano' },
  { value: 'flexitariano', label: 'Flexitariano' },
];

export function OnboardingDietStep({ dietPreference, onSelect }: OnboardingDietStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Qual é o seu estilo alimentar?</Text>
      <View style={styles.options}>
        {DIET_OPTIONS.map((option) => {
          const isSelected = dietPreference === option.value;
          return (
            <Pressable
              accessibilityLabel={option.label}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={option.value}
              onPress={() => onSelect(option.value)}
              testID={`onboarding-diet-option-${option.value}`}>
              <Pill tone={isSelected ? 'moss' : 'sand'} size="md">
                {option.label}
              </Pill>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
