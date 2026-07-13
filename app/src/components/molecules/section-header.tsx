import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Overline } from '@/components/atoms/overline';
import { fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';

export type SectionHeaderProps = {
  overline?: string;
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ overline, title, actionLabel, onActionPress }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titleGroup}>
        {overline ? <Overline>{overline}</Overline> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel ? (
        <Pressable onPress={onActionPress}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg - 4,
    gap: spacing.sm,
  },
  titleGroup: {
    gap: 3,
  },
  title: {
    ...typography.displayXs,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
  },
  action: {
    ...typography.labelMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fgBrand,
  },
});
