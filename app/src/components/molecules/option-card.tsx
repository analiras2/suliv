import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/atoms/icon';
import { colors, fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';

export type OptionCardSelectionMode = 'single' | 'multiple';

export type OptionCardProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  selected: boolean;
  selectionMode: OptionCardSelectionMode;
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
};

export function OptionCard({
  icon,
  title,
  subtitle,
  selected,
  selectionMode,
  onPress,
  accessibilityLabel,
  testID,
}: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      style={[styles.container, selected && styles.containerSelected]}>
      <Icon name={icon} color={selected ? colors.moss700 : semanticColors.fg} />
      <View style={styles.textGroup}>
        <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {selectionMode === 'single' ? (
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      ) : (
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected ? <Icon name="check" size={14} color={colors.sand25} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: semanticColors.border,
    backgroundColor: semanticColors.surface,
  },
  containerSelected: {
    borderColor: colors.moss500,
    backgroundColor: colors.moss100,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sansMedium,
    color: semanticColors.fg,
  },
  titleSelected: {
    color: colors.moss700,
  },
  subtitle: {
    ...typography.bodySm,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgSecondary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: semanticColors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.moss500,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.moss500,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radii.xs,
    borderWidth: 2,
    borderColor: semanticColors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.moss500,
    backgroundColor: colors.moss500,
  },
});
