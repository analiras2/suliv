import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';

export type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  testID?: string;
};

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
  testID,
}: FormFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={semanticColors.fgTertiary}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, multiline && styles.inputMultiline]}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxs,
  },
  label: {
    ...typography.labelMd,
    fontFamily: fontFamilies.sansMedium,
    color: semanticColors.fgSecondary,
  },
  input: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fg,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    backgroundColor: semanticColors.surface,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
