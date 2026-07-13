import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { Overline } from '@/components/atoms/overline';
import { Pill } from '@/components/atoms/pill';
import { IngredientRow } from '@/components/molecules/ingredient-row';
import { NutritionTile } from '@/components/molecules/nutrition-tile';
import { RecipeDetailHero } from '@/components/organisms/recipe-detail-hero';
import { colors, fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useRecipeDetailViewModel } from '@/module/recipes/viewModels/use-recipe-detail-view-model';

export type RecipeDetailScreenProps = {
  recipeId: string;
};

export function RecipeDetailScreen({ recipeId }: RecipeDetailScreenProps) {
  const { recipe, isSaved, toggleSave, goBack } = useRecipeDetailViewModel(recipeId);

  if (!recipe) {
    return null;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <RecipeDetailHero gradient={recipe.gradient} saved={isSaved} onBack={goBack} onToggleSave={toggleSave} />

      <View style={styles.body}>
        <View style={styles.pillRow}>
          <Pill tone="moss" icon={<Icon name="clock" size={11} color={colors.moss800} strokeWidth={2.2} />}>
            {recipe.time}
          </Pill>
          <Pill tone="sage">fácil</Pill>
          <Pill tone="clay">1 panela</Pill>
        </View>

        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.description}>
          {recipe.description} {recipe.meta}. Sem complicação.
        </Text>

        <View style={styles.nutritionRow}>
          <NutritionTile label="porções" value={String(recipe.servings)} />
          <NutritionTile label="proteína" value={`${recipe.proteinGrams} g`} />
          <NutritionTile label="kcal" value={String(recipe.kcal)} />
        </View>

        <View>
          <Overline>ingredientes</Overline>
          <View style={styles.ingredientList}>
            {recipe.ingredients.map((ingredient, index) => (
              <IngredientRow key={ingredient} label={ingredient} isFirst={index === 0} />
            ))}
          </View>
        </View>

        <View style={styles.ctaWrap}>
          <Button
            tone="primary"
            size="lg"
            style={styles.cta}
            icon={<Icon name="arrowRight" size={16} color={colors.sand25} strokeWidth={2.2} />}>
            Começar a cozinhar
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  body: {
    marginTop: -28,
    backgroundColor: semanticColors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg - 2,
    paddingTop: spacing.lg - 2,
    gap: spacing.md - 2,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  title: {
    ...typography.displayMd,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
  },
  description: {
    ...typography.bodyLg,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgSecondary,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  ingredientList: {
    marginTop: spacing.xs + 2,
  },
  ctaWrap: {
    paddingVertical: spacing.md,
  },
  cta: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
});
