import { BlurView } from 'expo-blur';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import { forwardRef } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { Icon, type IconName } from '@/components/atoms/icon';
import { colors, fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';

export function TabBarContainer({ children, ...props }: ViewProps) {
  return (
    <View {...props} style={styles.wrapper}>
      <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.row}>{children}</View>
    </View>
  );
}

export type TabBarButtonProps = TabTriggerSlotProps & {
  icon: IconName;
  label: string;
};

export const TabBarButton = forwardRef<View, TabBarButtonProps>(function TabBarButton(
  { icon, label, isFocused, ...props },
  ref,
) {
  const tintColor = isFocused ? colors.moss700 : semanticColors.fgSecondary;
  return (
    <Pressable ref={ref} {...props} style={styles.button}>
      <Icon name={icon} size={22} color={tintColor} strokeWidth={isFocused ? 2 : 1.75} />
      <Text style={[styles.label, { color: tintColor }]}>{label}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: colors.ink100,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.xs + 2,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
    backgroundColor: semanticColors.tabBarTranslucent,
  },
  button: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm - 2,
  },
  label: {
    ...typography.caption,
    fontFamily: fontFamilies.sansSemibold,
    letterSpacing: 0.2,
  },
});
