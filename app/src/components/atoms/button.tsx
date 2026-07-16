import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, fontFamilies, motion, radii, semanticColors, spacing } from '@/design-system/tokens';

export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'accent' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  children: string;
  tone?: ButtonTone;
  size?: ButtonSize;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
};

const TONE_STYLES: Record<ButtonTone, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.moss500, fg: colors.sand25 },
  secondary: { bg: colors.sand25, fg: colors.ink900, border: colors.ink200 },
  ghost: { bg: 'transparent', fg: colors.moss700 },
  accent: { bg: colors.clay500, fg: colors.sand25 },
  inverse: { bg: colors.ink900, fg: semanticColors.fgInverse },
};

const SIZE_STYLES: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 10, paddingHorizontal: spacing.md, fontSize: 14 },
  md: { paddingVertical: 13, paddingHorizontal: spacing.lg - 4, fontSize: 15 },
  lg: { paddingVertical: 16, paddingHorizontal: spacing.lg + 2, fontSize: 16 },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({ children, tone = 'primary', size = 'md', onPress, icon, style, testID }: ButtonProps) {
  const scale = useSharedValue(1);
  const toneStyle = TONE_STYLES[tone];
  const sizeStyle = SIZE_STYLES[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      testID={testID}
      onPressIn={() => {
        // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutated by design
        scale.value = withTiming(motion.pressScale, { duration: motion.durationFast });
      }}
      onPressOut={() => {
        // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutated by design
        scale.value = withTiming(1, { duration: motion.durationFast });
      }}
      style={[
        styles.base,
        {
          backgroundColor: toneStyle.bg,
          borderColor: toneStyle.border,
          borderWidth: toneStyle.border ? 1 : 0,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
        },
        animatedStyle,
        style,
      ]}>
      {icon}
      <Text style={[styles.label, { color: toneStyle.fg, fontSize: sizeStyle.fontSize }]}>{children}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: fontFamilies.sansSemibold,
  },
});
