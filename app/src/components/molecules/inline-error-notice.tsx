import { StyleSheet, Text } from 'react-native';

import { layout, semanticColors, spacing, typography } from '@/design-system/tokens';

export type InlineErrorNoticeProps = {
  message: string | null | undefined;
  testID?: string;
};

/** A short inline error line; renders nothing when there is no message. */
export function InlineErrorNotice({ message, testID }: InlineErrorNoticeProps) {
  if (!message) return null;

  return (
    <Text accessibilityRole="alert" style={styles.notice} testID={testID}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  notice: {
    ...typography.bodyMd,
    color: semanticColors.danger,
    paddingHorizontal: layout.screenGutter,
    paddingVertical: spacing.xs,
  },
});
