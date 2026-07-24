import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import { colors, fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';

export type ServingsStepperProps = {
  servings: number;
  onChange: (servings: number) => void;
};

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 20;

function ServingsStepperComponent({ servings, onChange }: ServingsStepperProps) {
  const canDecrease = servings > MIN_SERVINGS;
  const canIncrease = servings < MAX_SERVINGS;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>porções</Text>
      <View style={styles.stepper}>
        <Pressable
          onPress={() => onChange(servings - 1)}
          disabled={!canDecrease}
          style={[styles.button, !canDecrease && styles.buttonDisabled]}
          hitSlop={8}
          testID="servings-stepper-decrease">
          <Icon name="minus" size={16} color={canDecrease ? colors.ink900 : colors.ink300} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.value} testID="servings-stepper-value">
          {servings}
        </Text>
        <Pressable
          onPress={() => onChange(servings + 1)}
          disabled={!canIncrease}
          style={[styles.button, !canIncrease && styles.buttonDisabled]}
          hitSlop={8}
          testID="servings-stepper-increase">
          <Icon name="plus" size={16} color={canIncrease ? colors.ink900 : colors.ink300} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

export const ServingsStepper = memo(ServingsStepperComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.labelMd,
    fontFamily: fontFamilies.sansSemibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: semanticColors.fgSecondary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: semanticColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  value: {
    ...typography.titleMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fg,
    minWidth: 20,
    textAlign: 'center',
  },
});
