import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamilies, radii, recipeGradients, typography } from '@/design-system/tokens';
import type { Category, RecipeCategoryKey, RecipeGradientKey } from '@/module/recipes/types';

const CIRCLE_SIZE = 76;

const CATEGORY_GRADIENTS: Record<RecipeCategoryKey, RecipeGradientKey> = {
  cafe_da_manha: 'peach',
  almoco_jantar: 'moss',
  lanche: 'sand',
  sobremesa: 'brick',
  bebida: 'clay',
  molhos_acompanhamentos: 'olive',
};

export type CategoryChipProps = {
  category: Category;
};

function CategoryChipComponent({ category }: CategoryChipProps) {
  return (
    <Pressable style={styles.container}>
      <View style={styles.circleWrapper}>
        <LinearGradient
          colors={recipeGradients[CATEGORY_GRADIENTS[category.key]]}
          style={styles.circle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
      <Text style={styles.label}>{category.label}</Text>
    </Pressable>
  );
}

export const CategoryChip = memo(CategoryChipComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    width: CIRCLE_SIZE,
  },
  circleWrapper: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.ink100,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radii.pill,
  },
  label: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    color: colors.ink700,
    textAlign: 'center',
  },
});
