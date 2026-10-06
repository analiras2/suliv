import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import { fontFamilies, layout, semanticColors, spacing, typography } from '@/design-system/tokens';

export type SettingsHeaderProps = {
  title: string;
  onBack: () => void;
  testID?: string;
  /** Screens whose title is already targeted by an e2e flow can keep that id here. */
  titleTestID?: string;
};

export function SettingsHeader({ title, onBack, testID, titleTestID }: SettingsHeaderProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Voltar"
        accessibilityRole="button"
        onPress={onBack}
        testID={testID ?? 'settings-header-back'}>
        <Icon color={semanticColors.fg} name="back" size={22} />
      </Pressable>
      <Text style={styles.title} testID={titleTestID}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.displayXs,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
  },
});
