import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';

export type WeekProgressBarProps = {
  progress: number;
  helperText: string;
};

export function WeekProgressBar({ progress, helperText }: WeekProgressBarProps) {
  const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

  return (
    <View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.helper}>{helperText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    backgroundColor: semanticColors.bgSubtle,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.moss500,
    borderRadius: radii.pill,
  },
  helper: {
    ...typography.caption,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgSecondary,
    marginTop: spacing.xs,
  },
});
