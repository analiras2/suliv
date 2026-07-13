import { StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import { fontFamilies, radii, semanticColors, shadows, spacing, typography } from '@/design-system/tokens';

export type SearchFieldProps = {
  value?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
};

const DEFAULT_PLACEHOLDER = 'lentilha, grão-de-bico, 15 min…';

export function SearchField({ value, onChangeText, placeholder = DEFAULT_PLACEHOLDER }: SearchFieldProps) {
  return (
    <View style={styles.container}>
      <Icon name="search" size={18} color={semanticColors.fgSecondary} strokeWidth={1.9} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={semanticColors.fgSecondary}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: semanticColors.surface,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md - 2,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    ...typography.labelLg,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fg,
  },
});
