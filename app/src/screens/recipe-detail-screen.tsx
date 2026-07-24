import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { Overline } from '@/components/atoms/overline';
import { IngredientRow } from '@/components/molecules/ingredient-row';
import { AllergyWarningBanner } from '@/components/organisms/allergy-warning-banner';
import { CommentsSection } from '@/components/organisms/comments-section';
import { RecipeDetailHero } from '@/components/organisms/recipe-detail-hero';
import { ServingsStepper } from '@/components/organisms/servings-stepper';
import { colors, fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useRecipeDetailViewModel } from '@/module/recipes/viewModels/use-recipe-detail-view-model';

export type RecipeDetailScreenProps = {
  recipeId: string;
};

export function RecipeDetailScreen({ recipeId }: RecipeDetailScreenProps) {
  const {
    recipe,
    isLoading,
    notFound,
    servings,
    setServings,
    scaledIngredients,
    averageRating,
    ratingCount,
    isSaved,
    toggleSave,
    startCooking,
    goBack,
    refetch,
  } = useRecipeDetailViewModel(recipeId);

  if (notFound) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.notFound}>
          <View style={styles.notFoundIcon}>
            <Icon name="search" size={28} color={colors.ink500} strokeWidth={1.6} />
          </View>
          <Text style={styles.notFoundTitle}>Receita não encontrada</Text>
          <Text style={styles.notFoundBody}>Essa receita não existe ou não está mais disponível.</Text>
          <Button tone="primary" size="sm" onPress={goBack} style={styles.notFoundButton}>
            Voltar
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !recipe) {
    return null;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <RecipeDetailHero
        coverImageUrl={recipe.coverImageUrl}
        timeBucket={recipe.timeBucket}
        difficulty={recipe.difficulty}
        dietPreference={recipe.dietPreference}
        servings={recipe.servings}
        averageRating={averageRating}
        ratingCount={ratingCount}
        saved={isSaved}
        onBack={goBack}
        onToggleSave={toggleSave}
      />

      <View style={styles.body}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.description}>{recipe.description}</Text>

        <View style={styles.section}>
          <View style={styles.ingredientsHeader}>
            <Overline>ingredientes</Overline>
            <ServingsStepper servings={servings} onChange={setServings} />
          </View>

          {recipe.conflictsWithUser && recipe.conflictingAllergens ? (
            <AllergyWarningBanner conflictingAllergens={recipe.conflictingAllergens} />
          ) : null}

          <View style={styles.ingredientList}>
            {scaledIngredients.map((ingredient, index) => (
              <IngredientRow key={ingredient.name} ingredient={ingredient} isFirst={index === 0} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Overline>modo de preparo</Overline>
          <View style={styles.stepList}>
            {recipe.steps.map((step) => (
              <View key={step.order} style={styles.step}>
                <Text style={styles.stepNumber}>{step.order}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <CommentsSection recipeId={recipe.id} onReviewChanged={refetch} />

        <View style={styles.ctaWrap}>
          <Button
            tone="primary"
            size="lg"
            style={styles.cta}
            onPress={startCooking}
            icon={<Icon name="arrowRight" size={16} color={colors.sand25} strokeWidth={2.2} />}>
            Começar a cozinhar
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
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
  section: {
    gap: spacing.xs + 2,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ingredientList: {
    marginTop: 2,
  },
  stepList: {
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepNumber: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fgAccent,
    width: 20,
  },
  stepDescription: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fg,
    flex: 1,
  },
  ctaWrap: {
    paddingVertical: spacing.md,
  },
  cta: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs + 2,
  },
  notFoundIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: semanticColors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  notFoundTitle: {
    ...typography.titleMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fg,
  },
  notFoundBody: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgSecondary,
    textAlign: 'center',
  },
  notFoundButton: {
    marginTop: spacing.sm,
  },
});
