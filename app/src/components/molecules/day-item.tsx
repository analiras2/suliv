import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import { colors, fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';
import type { DayPlanEntry } from '@/module/recipes/types';

export type DayItemProps = DayPlanEntry;

function DayItemComponent({ day, label, recipe, done }: DayItemProps) {
  return (
    <View style={[styles.row, done ? styles.rowDone : styles.rowPending]}>
      <View style={[styles.dateBadge, done ? styles.dateBadgeDone : styles.dateBadgePending]}>
        <Text style={[styles.day, done && styles.dayDone]}>{day}</Text>
        <Text style={[styles.label, done && styles.dayDone]}>{label}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {recipe.title}
        </Text>
        <Text style={styles.meta}>{recipe.meta}</Text>
      </View>
      {done ? (
        <Icon name="check" size={18} color={colors.moss500} strokeWidth={2.2} />
      ) : (
        <Icon name="chevron" size={18} color={colors.ink300} />
      )}
    </View>
  );
}

export const DayItem = memo(DayItemComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    borderWidth: 1,
    borderRadius: radii.lg - 4,
    padding: spacing.sm + 2,
  },
  rowDone: {
    backgroundColor: colors.moss50,
    borderColor: colors.moss200,
  },
  rowPending: {
    backgroundColor: semanticColors.surface,
    borderColor: semanticColors.border,
  },
  dateBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateBadgeDone: {
    backgroundColor: colors.moss500,
  },
  dateBadgePending: {
    backgroundColor: semanticColors.bgSubtle,
  },
  day: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemibold,
    textTransform: 'uppercase',
    color: colors.ink700,
    opacity: 0.8,
  },
  dayDone: {
    color: colors.sand25,
  },
  label: {
    fontFamily: fontFamilies.sansSemibold,
    fontSize: 16,
    lineHeight: 18,
    color: colors.ink700,
  },
  info: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    ...typography.labelLg,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fg,
  },
  meta: {
    ...typography.caption,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgSecondary,
  },
});
