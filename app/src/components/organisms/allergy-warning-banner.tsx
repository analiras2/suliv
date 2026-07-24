import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import { fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';

export type AllergyWarningBannerProps = {
  conflictingAllergens: string[];
};

export function AllergyWarningBanner({ conflictingAllergens }: AllergyWarningBannerProps) {
  if (conflictingAllergens.length === 0) {
    return null;
  }

  return (
    <View style={styles.banner} testID="allergy-warning-banner">
      <Icon name="warning" size={18} color={semanticColors.warning} strokeWidth={2} />
      <Text style={styles.text}>
        Contém {conflictingAllergens.join(', ')} — atenção às suas restrições declaradas.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs + 2,
    backgroundColor: semanticColors.warningSoft,
    borderRadius: radii.md,
    padding: spacing.sm + 2,
  },
  text: {
    ...typography.bodySm,
    fontFamily: fontFamilies.sansMedium,
    color: semanticColors.fg,
    flex: 1,
  },
});
