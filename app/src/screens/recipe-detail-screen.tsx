import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { RecipeDetailContent } from '@/components/organisms/recipe-detail-content';
import { colors, fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useRecipeDetailViewModel } from '@/module/recipes/viewModels/use-recipe-detail-view-model';

export type RecipeDetailScreenProps = {
  recipeId: string;
  origin?: string;
};

export function RecipeDetailScreen({ recipeId, origin }: RecipeDetailScreenProps) {
  const detail = useRecipeDetailViewModel(recipeId, undefined, origin);

  if (detail.notFound) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.notFound}>
          <View style={styles.notFoundIcon}>
            <Icon name="search" size={28} color={colors.ink500} strokeWidth={1.6} />
          </View>
          <Text style={styles.notFoundTitle}>Receita não encontrada</Text>
          <Text style={styles.notFoundBody}>Essa receita não existe ou não está mais disponível.</Text>
          <Button tone="primary" size="sm" onPress={detail.goBack} style={styles.notFoundButton}>
            Voltar
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (detail.isLoading || !detail.recipe) {
    return null;
  }

  return <RecipeDetailContent detail={{ ...detail, recipe: detail.recipe }} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semanticColors.bg,
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
