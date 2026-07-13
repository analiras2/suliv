import { StyleSheet, Text, View } from 'react-native';

import { Overline } from '@/components/atoms/overline';
import { fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';

export type GreetingProps = {
  name: string;
};

export function Greeting({ name }: GreetingProps) {
  return (
    <View style={styles.container}>
      <Overline>bom dia, {name.toLowerCase()}</Overline>
      <Text style={styles.title}>
        O que vai <Text style={styles.emphasis}>hoje</Text>?
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg - 4,
    paddingTop: spacing.sm + 2,
    gap: 4,
  },
  title: {
    ...typography.displaySm,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
  },
  emphasis: {
    fontFamily: fontFamilies.displayItalic,
    color: semanticColors.fgBrand,
    fontStyle: 'italic',
  },
});
