import { StyleSheet, View } from 'react-native';

import { Overline } from '@/components/atoms/overline';
import { colors, radii, semanticColors, spacing } from '@/design-system/tokens';

export type OnboardingProgressHeaderProps = {
  currentStep: number;
  totalSteps: number;
  label: string;
};

export function OnboardingProgressHeader({ currentStep, totalSteps, label }: OnboardingProgressHeaderProps) {
  const percent = Math.round((Math.min(currentStep + 1, totalSteps) / totalSteps) * 100);

  return (
    <View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <Overline style={styles.label}>{label}</Overline>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: semanticColors.bgSubtle,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.moss500,
    borderRadius: radii.pill,
  },
  label: {
    marginTop: spacing.xs,
  },
});
