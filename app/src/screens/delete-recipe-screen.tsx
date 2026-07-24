import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/atoms/button';
import { fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useDeleteRecipeScreenViewModel } from '@/module/recipe-authoring/viewModels/use-delete-recipe-screen-view-model';

export type DeleteRecipeScreenProps = {
  recipeId: string;
};

export function DeleteRecipeScreen({ recipeId }: DeleteRecipeScreenProps) {
  const { isLoadingPreview, favoritesCount, error, isDeleting, confirm, cancel } =
    useDeleteRecipeScreenViewModel(recipeId);

  if (isLoadingPreview) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loading]} edges={['top']}>
        <ActivityIndicator color={semanticColors.brand} testID="delete-recipe-loading" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.card}>
        <Text style={styles.title}>Excluir esta receita?</Text>
        {favoritesCount > 0 ? (
          <Text style={styles.body} testID="delete-recipe-favorites-impact">
            {favoritesCount === 1
              ? '1 pessoa salvou essa receita. Ela vai sumir da lista de salvos dela também.'
              : `${favoritesCount} pessoas salvaram essa receita. Ela vai sumir da lista de salvos delas também.`}
          </Text>
        ) : (
          <Text style={styles.body}>Essa ação não pode ser desfeita.</Text>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.actions}>
          <Button tone="ghost" size="sm" onPress={cancel} testID="delete-recipe-cancel">
            Cancelar
          </Button>
          <Button tone="accent" size="sm" onPress={() => void confirm()} testID="delete-recipe-confirm">
            {isDeleting ? 'Excluindo…' : 'Excluir'}
          </Button>
        </View>
      </View>
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
  card: {
    margin: spacing.lg - 4,
    backgroundColor: semanticColors.surfaceRaised,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.titleMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fg,
  },
  body: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgSecondary,
  },
  error: {
    ...typography.bodySm,
    fontFamily: fontFamilies.sans,
    color: semanticColors.danger,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
