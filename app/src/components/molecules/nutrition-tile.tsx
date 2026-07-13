import { StyleSheet, Text, View } from 'react-native';

import { fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';

export type NutritionTileProps = {
  label: string;
  value: string;
};

export function NutritionTile({ label, value }: NutritionTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md - 2,
  },
  label: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: semanticColors.fgSecondary,
  },
  value: {
    ...typography.titleMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fg,
    marginTop: 2,
  },
});
