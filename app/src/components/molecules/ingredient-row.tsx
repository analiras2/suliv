import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamilies, semanticColors, typography } from '@/design-system/tokens';

export type IngredientRowProps = {
  label: string;
  isFirst: boolean;
};

function IngredientRowComponent({ label, isFirst }: IngredientRowProps) {
  return (
    <View style={[styles.row, !isFirst && styles.rowBordered]}>
      <View style={styles.checkbox} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export const IngredientRow = memo(IngredientRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowBordered: {
    borderTopWidth: 1,
    borderTopColor: colors.ink100,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.ink300,
    flexShrink: 0,
  },
  label: {
    ...typography.bodyLg,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fg,
  },
});
