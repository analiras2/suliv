import { StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/atoms/pill';
import { semanticColors, spacing, typography } from '@/design-system/tokens';

export type OnboardingAddedTermsProps = {
  terms: string[];
};

export function OnboardingAddedTerms({ terms }: OnboardingAddedTermsProps) {
  if (terms.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Termos adicionados</Text>
      <View style={styles.list}>
        {terms.map((term, index) => (
          <View key={`${term}-${index}`} testID={`onboarding-allergy-added-term-${index}`}>
            <Pill tone="ink" size="sm">
              {term}
            </Pill>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    ...typography.labelMd,
    color: semanticColors.fg,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
