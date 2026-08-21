import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef, useScrollViewOffset } from 'react-native-reanimated';

import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { Overline } from '@/components/atoms/overline';
import { IngredientRow } from '@/components/molecules/ingredient-row';
import { AllergyWarningBanner } from '@/components/organisms/allergy-warning-banner';
import { CommentsSection } from '@/components/organisms/comments-section';
import { RecipeDetailHero } from '@/components/organisms/recipe-detail-hero';
import { ServingsStepper } from '@/components/organisms/servings-stepper';
import { colors, fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';
import type { RecipeDetail } from '@/module/recipes/types';
import type { RecipeDetailViewModel } from '@/module/recipes/viewModels/use-recipe-detail-view-model';

export type RecipeDetailContentProps = {
  detail: RecipeDetailViewModel & { recipe: RecipeDetail };
};

/**
 * The loaded half of the recipe detail screen, split out so the scroll ref and its offset
 * are only created where the Animated.ScrollView actually mounts. Kept in the screen, those
 * hooks also ran on the loading and not-found branches, where the ref binds to nothing and
 * Reanimated warns about an unattached animated ref.
 */
export function RecipeDetailContent({ detail }: RecipeDetailContentProps) {
  const { recipe } = detail;
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={styles.content}
      scrollEventThrottle={16}>
      <RecipeDetailHero
        coverImageUrl={recipe.coverImageUrl}
        timeBucket={recipe.timeBucket}
        difficulty={recipe.difficulty}
        servings={recipe.servings}
        averageRating={detail.averageRating}
        ratingCount={detail.ratingCount}
        saved={detail.isSaved}
        onBack={detail.goBack}
        onToggleSave={detail.toggleSave}
        scrollOffset={scrollOffset}
      />

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.dietPreference === 'vegano' ? (
            <View
              accessibilityLabel="Receita vegana"
              accessibilityRole="image"
              style={styles.veganBadge}
              testID="recipe-detail-vegan-badge">
              <Icon name="vegan" size={20} color={colors.moss800} strokeWidth={2} />
            </View>
          ) : null}
        </View>
        <Text style={styles.description}>{recipe.description}</Text>

        <View style={styles.section}>
          <View style={styles.ingredientsHeader}>
            <Overline>ingredientes</Overline>
            <ServingsStepper servings={detail.servings} onChange={detail.setServings} />
          </View>

          {recipe.conflictsWithUser && recipe.conflictingAllergens ? (
            <AllergyWarningBanner conflictingAllergens={recipe.conflictingAllergens} />
          ) : null}

          <View style={styles.ingredientList}>
            {detail.scaledIngredients.map((ingredient, index) => (
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

        <CommentsSection recipeId={recipe.id} onReviewChanged={detail.refetch} />

        <View style={styles.ctaWrap}>
          <Button
            tone="primary"
            size="lg"
            style={styles.cta}
            onPress={detail.startCooking}
            icon={<Icon name="arrowRight" size={16} color={colors.sand25} strokeWidth={2.2} />}>
            Começar a cozinhar
          </Button>
        </View>
      </View>
    </Animated.ScrollView>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    ...typography.displayMd,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
    flex: 1,
  },
  // Nudged down so the mark sits on the first line's optical centre rather than its box top.
  veganBadge: {
    marginTop: spacing.xxs,
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
});
