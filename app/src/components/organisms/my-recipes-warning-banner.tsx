import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import { fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';

export type MyRecipesWarningBannerProps = {
  message: string;
  testID?: string;
};

export function MyRecipesWarningBanner({ message, testID }: MyRecipesWarningBannerProps) {
  return (
    <View style={styles.banner} testID={testID}>
      <Icon name="warning" size={18} color={semanticColors.warning} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: semanticColors.warningSoft,
    borderRadius: radii.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
  },
  text: {
    ...typography.bodySm,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fg,
    flex: 1,
  },
});
