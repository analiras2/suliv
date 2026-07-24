import { StyleSheet, Text, View } from 'react-native';

import { fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';
import type { RecipeStepDto } from '@/module/recipes/types';

export type StepProgressListProps = {
  steps: RecipeStepDto[];
  currentStepIndex: number;
};

export function StepProgressList({ steps, currentStepIndex }: StepProgressListProps) {
  return (
    <View style={styles.list} testID="step-progress-list">
      {steps.map((step, index) => {
        const isCurrent = index === currentStepIndex;
        const isDone = index < currentStepIndex;

        return (
          <View key={step.order} style={[styles.step, isCurrent && styles.stepCurrent]}>
            <Text style={[styles.stepNumber, isDone && styles.stepNumberDone, isCurrent && styles.stepNumberCurrent]}>
              {step.order}
            </Text>
            <Text style={[styles.stepDescription, isDone && styles.stepDescriptionDone]}>{step.description}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 14,
  },
  stepCurrent: {
    backgroundColor: semanticColors.surfaceTint,
  },
  stepNumber: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fgTertiary,
    width: 22,
  },
  stepNumberCurrent: {
    color: semanticColors.fgBrand,
  },
  stepNumberDone: {
    color: semanticColors.fgSecondary,
  },
  stepDescription: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fg,
    flex: 1,
  },
  stepDescriptionDone: {
    color: semanticColors.fgSecondary,
    textDecorationLine: 'line-through',
  },
});
