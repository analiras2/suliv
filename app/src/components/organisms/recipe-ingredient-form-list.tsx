import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';
import type { DraftIngredient, IngredientUnit } from '@/module/recipe-authoring/types';

const UNIT_OPTIONS: readonly IngredientUnit[] = [
  'unidade',
  'g',
  'kg',
  'ml',
  'l',
  'xicara',
  'colher_sopa',
  'colher_cha',
  'pitada',
  'a_gosto',
];

const UNIT_LABELS: Record<IngredientUnit, string> = {
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  l: 'l',
  unidade: 'unidade',
  xicara: 'xícara',
  colher_sopa: 'colher de sopa',
  colher_cha: 'colher de chá',
  pitada: 'pitada',
  a_gosto: 'a gosto',
};

export type RecipeIngredientFormListProps = {
  ingredients: DraftIngredient[];
  onAdd: () => void;
  onUpdate: (index: number, changes: Partial<DraftIngredient>) => void;
  onRemove: (index: number) => void;
};

export function RecipeIngredientFormList({ ingredients, onAdd, onUpdate, onRemove }: RecipeIngredientFormListProps) {
  return (
    <View style={styles.container} testID="recipe-form-ingredients">
      {ingredients.map((ingredient, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.rowTop}>
            <TextInput
              value={ingredient.name}
              onChangeText={(value) => onUpdate(index, { name: value })}
              placeholder="Ingrediente"
              placeholderTextColor={semanticColors.fgTertiary}
              style={styles.nameInput}
              testID={`ingredient-name-${index}`}
            />
            <TextInput
              value={ingredient.quantity === null ? '' : String(ingredient.quantity)}
              onChangeText={(value) => onUpdate(index, { quantity: value === '' ? null : Number(value) })}
              placeholder="Qtd"
              placeholderTextColor={semanticColors.fgTertiary}
              keyboardType="decimal-pad"
              style={styles.quantityInput}
              testID={`ingredient-quantity-${index}`}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remover ingrediente"
              onPress={() => onRemove(index)}
              testID={`ingredient-remove-${index}`}>
              <Icon name="close" size={16} color={semanticColors.fgSecondary} />
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitRow}>
            {UNIT_OPTIONS.map((unit) => (
              <Pressable
                key={unit}
                accessibilityRole="button"
                accessibilityState={{ selected: ingredient.unit === unit }}
                onPress={() => onUpdate(index, { unit })}
                style={[styles.unitChip, ingredient.unit === unit && styles.unitChipSelected]}
                testID={`ingredient-unit-${index}-${unit}`}>
                <Text style={[styles.unitChipLabel, ingredient.unit === unit && styles.unitChipLabelSelected]}>
                  {UNIT_LABELS[unit]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ))}
      <Button tone="secondary" size="sm" onPress={onAdd} testID="ingredient-add">
        + Adicionar ingrediente
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: semanticColors.border,
    paddingBottom: spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nameInput: {
    flex: 1,
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fg,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  quantityInput: {
    width: 64,
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fg,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  unitRow: {
    gap: spacing.xxs,
  },
  unitChip: {
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  unitChipSelected: {
    borderColor: semanticColors.brand,
    backgroundColor: semanticColors.brandMuted,
  },
  unitChipLabel: {
    ...typography.labelMd,
    fontFamily: fontFamilies.sansMedium,
    color: semanticColors.fgSecondary,
  },
  unitChipLabelSelected: {
    color: semanticColors.fgBrand,
  },
});
