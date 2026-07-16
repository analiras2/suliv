import { StyleSheet, Text, View } from 'react-native';

import { type IconName } from '@/components/atoms/icon';
import { OptionCard } from '@/components/molecules/option-card';
import { semanticColors, spacing, typography } from '@/design-system/tokens';
import type { DietPreference } from '@/module/onboarding/services/onboarding-service';

export type OnboardingDietStepProps = {
  dietPreference: DietPreference | null;
  onSelect: (value: DietPreference) => void;
};

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

export function OnboardingDietStep({ dietPreference, onSelect }: OnboardingDietStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Qual é o seu estilo alimentar?</Text>
      <View style={styles.options}>
        {DIET_OPTIONS.map((option) => {
          const isSelected = dietPreference === option.value;
          return (
            <OptionCard
              accessibilityLabel={option.label}
              icon={option.icon}
              key={option.value}
              onPress={() => onSelect(option.value)}
              selected={isSelected}
              selectionMode="single"
              subtitle={option.subtitle}
              testID={`onboarding-diet-option-${option.value}`}
              title={option.label}
            />
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
    gap: spacing.sm,
  },
});
