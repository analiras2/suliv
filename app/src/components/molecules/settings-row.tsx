import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/atoms/icon';
import { colors, fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';

export type SettingsRowProps = {
  icon: IconName;
  label: string;
  isLast?: boolean;
  tone?: 'default' | 'danger';
  onPress?: () => void;
  testID?: string;
};

export function SettingsRow({ icon, label, isLast = false, tone = 'default', onPress, testID }: SettingsRowProps) {
  const labelColor = tone === 'danger' ? semanticColors.danger : semanticColors.fg;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.row, !isLast && styles.rowBordered]}
      testID={testID}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={18} color={tone === 'danger' ? semanticColors.danger : semanticColors.fgSecondary} />
      </View>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      {tone === 'default' ? <Icon name="chevron" size={18} color={colors.ink300} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  rowBordered: {
    borderBottomWidth: 1,
    borderBottomColor: colors.ink100,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: semanticColors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sansMedium,
    flex: 1,
  },
});
