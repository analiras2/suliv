import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';

export type PillTone = 'moss' | 'sage' | 'clay' | 'sand' | 'ink';
export type PillSize = 'sm' | 'md';

export type PillProps = {
  children: React.ReactNode;
  tone?: PillTone;
  size?: PillSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

const TONE_STYLES: Record<PillTone, { bg: string; fg: string; border?: string }> = {
  moss: { bg: colors.moss100, fg: colors.moss800 },
  sage: { bg: colors.sage100, fg: colors.ink700 },
  clay: { bg: colors.clay100, fg: colors.clay700 },
  sand: { bg: semanticColors.bgSubtle, fg: colors.ink700, border: colors.ink200 },
  ink: { bg: colors.ink900, fg: colors.sand25 },
};

const SIZE_STYLES: Record<PillSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 5, paddingHorizontal: spacing.xs + 2, fontSize: 12 },
  md: { paddingVertical: 7, paddingHorizontal: spacing.sm, fontSize: typography.labelMd.fontSize },
};

export function Pill({ children, tone = 'moss', size = 'md', icon, style }: PillProps) {
  const toneStyle = TONE_STYLES[tone];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: toneStyle.bg,
          borderColor: toneStyle.border,
          borderWidth: toneStyle.border ? 1 : 0,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
        },
        style,
      ]}>
      {icon}
      <Text style={[styles.label, { color: toneStyle.fg, fontSize: sizeStyle.fontSize }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: fontFamilies.sansMedium,
  },
});
