import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/atoms/button';
import { Overline } from '@/components/atoms/overline';
import { RecipeCoverImageField } from '@/components/organisms/recipe-cover-image-field';
import { RecipeFormFields } from '@/components/organisms/recipe-form-fields';
import { fontFamilies, layout, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useRecipeCategoriesQuery } from '@/module/recipe-authoring/viewModels/use-recipe-categories-query';
import type { RecipeFormExisting } from '@/module/recipe-authoring/viewModels/use-recipe-form-view-model';
import { useRecipeFormScreenViewModel } from '@/module/recipe-authoring/viewModels/use-recipe-form-screen-view-model';
import { useResolveRecipeFormExisting } from '@/module/recipe-authoring/viewModels/use-resolve-recipe-form-existing';

export type RecipeFormScreenProps = {
  recipeId?: string;
};

export function RecipeFormScreen({ recipeId }: RecipeFormScreenProps) {
  const { isReady, existing } = useResolveRecipeFormExisting(recipeId);

  if (!isReady) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loading]} edges={['top']}>
        <ActivityIndicator color={semanticColors.brand} testID="recipe-form-loading" />
      </SafeAreaView>
    );
  }

  return <RecipeFormBody existing={existing} />;
}

function RecipeFormBody({ existing }: { existing?: RecipeFormExisting }) {
  const form = useRecipeFormScreenViewModel(existing);
  const categoriesQuery = useRecipeCategoriesQuery();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Overline>{form.isApprovedEdit ? 'editar receita' : 'nova receita'}</Overline>
        <Text style={styles.title}>{form.isApprovedEdit ? 'Editar receita' : 'Conte sua receita'}</Text>
        {form.isApprovedEdit ? (
          <Text style={styles.notice} testID="recipe-form-remoderation-notice">
            Essa receita já está aprovada. Qualquer alteração volta para moderação antes de aparecer de novo.
          </Text>
        ) : null}

        <RecipeCoverImageField
          imageUri={form.coverImageUrl}
          isMissing={form.missingCoverImage}
          onPickFromLibrary={() => void form.pickCoverImageFromLibrary()}
          onTakePhoto={() => void form.captureCoverImage()}
        />

        <RecipeFormFields form={form} categories={categoriesQuery.data ?? []} />

        {form.missingCoverImage ? (
          <Text style={styles.error} testID="recipe-form-missing-image-error">
            Adicione uma foto de capa antes de enviar.
          </Text>
        ) : null}
        {form.submitError ? (
          <Text style={styles.error} testID="recipe-form-submit-error">
            {form.submitError}
          </Text>
        ) : null}

        <Button
          tone="primary"
          size="lg"
          style={styles.submitButton}
          onPress={() => void form.submit()}
          testID="recipe-form-submit">
          {form.isSubmitting ? 'Enviando…' : form.isApprovedEdit ? 'Salvar alterações' : 'Enviar para moderação'}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg - 4,
    paddingTop: spacing.sm + 2,
    paddingBottom: layout.tabBarClearance,
  },
  title: {
    ...typography.displayXs,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
  },
  notice: {
    ...typography.bodySm,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgAccent,
  },
  error: {
    ...typography.bodySm,
    fontFamily: fontFamilies.sans,
    color: semanticColors.danger,
  },
  submitButton: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
});
