import { StyleSheet, Text, View } from 'react-native';

import { MyRecipeRow } from '@/components/molecules/my-recipe-row';
import { colors, fontFamilies, spacing, typography } from '@/design-system/tokens';
import type { MyRecipeStatus, MyRecipeSummary } from '@/module/recipe-authoring/types';

const SECTION_TITLES: Record<MyRecipeStatus, string> = {
  rascunho: 'Rascunhos',
  em_analise: 'Em análise',
  aprovada: 'Aprovadas',
  precisa_de_ajustes: 'Precisam de ajustes',
};

const EDITABLE_STATUSES: readonly MyRecipeStatus[] = ['rascunho', 'precisa_de_ajustes', 'aprovada'];

export type MyRecipesStatusSectionProps = {
  status: MyRecipeStatus;
  recipes: MyRecipeSummary[];
  onOpenRecipe: (recipeId: string) => void;
  onDeleteRecipe: (recipeId: string) => void;
};

export function MyRecipesStatusSection({
  status,
  recipes,
  onOpenRecipe,
  onDeleteRecipe,
}: MyRecipesStatusSectionProps) {
  if (recipes.length === 0) {
    return null;
  }

  return (
    <View style={styles.section} testID={`my-recipes-section-${status}`}>
      <Text style={styles.title}>{SECTION_TITLES[status]}</Text>
      <View>
        {recipes.map((recipe) => (
          <MyRecipeRow
            key={recipe.id}
            recipe={recipe}
            editable={EDITABLE_STATUSES.includes(status)}
            onPress={() => onOpenRecipe(recipe.id)}
            onDelete={() => onDeleteRecipe(recipe.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.xs,
  },
  title: {
    ...typography.labelLg,
    fontFamily: fontFamilies.sansSemibold,
    color: colors.ink500,
    textTransform: 'uppercase',
  },
});
