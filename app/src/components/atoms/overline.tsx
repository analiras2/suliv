import { StyleSheet, Text, type TextProps } from 'react-native';

import { fontFamilies, semanticColors, typography } from '@/design-system/tokens';

export type OverlineProps = TextProps & {
  color?: string;
};

export function Overline({ style, color = semanticColors.fgBrand, ...rest }: OverlineProps) {
  return <Text style={[styles.overline, { color }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  overline: {
    ...typography.overline,
    fontFamily: fontFamilies.sansSemibold,
    textTransform: 'uppercase',
  },
});
