import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamilies, semanticColors, typography } from '@/design-system/tokens';
import type { ScaledIngredient } from '@/module/recipes/utils/scale-ingredients';

export type IngredientRowProps = {
  ingredient: ScaledIngredient;
  isFirst: boolean;
};

function IngredientRowComponent({ ingredient, isFirst }: IngredientRowProps) {
  return (
    <View style={[styles.row, !isFirst && styles.rowBordered]}>
      <View style={styles.checkbox} />
      <Text style={styles.label}>
        <Text style={styles.quantity}>{ingredient.displayQuantity}</Text> {ingredient.name}
      </Text>
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
    flexShrink: 1,
  },
  quantity: {
    fontFamily: fontFamilies.sansSemibold,
  },
});
