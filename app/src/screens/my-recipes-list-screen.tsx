import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/atoms/button';
import { Overline } from '@/components/atoms/overline';
import { StateView } from '@/components/molecules/state-view';
import { MyRecipesStatusSection } from '@/components/organisms/my-recipes-status-section';
import { MyRecipesWarningBanner } from '@/components/organisms/my-recipes-warning-banner';
import { fontFamilies, layout, semanticColors, spacing, typography } from '@/design-system/tokens';
import { STATE_COPY } from '@/lib/state-copy';
import { useMyRecipesListScreenViewModel } from '@/module/recipe-authoring/viewModels/use-my-recipes-list-screen-view-model';

export function MyRecipesListScreen() {
  const {
    groups,
    isEmpty,
    isLoading,
    error,
    warnings,
    statusOrder,
    openRecipe,
    openDeleteConfirmation,
    createRecipe,
  } = useMyRecipesListScreenViewModel();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loading]} edges={['top']}>
        <ActivityIndicator color={semanticColors.brand} testID="my-recipes-loading" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Overline>minhas receitas</Overline>
          <Text style={styles.title}>Suas criações</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        {warnings.map((warning) => (
          <MyRecipesWarningBanner key={warning} message={warning} testID="my-recipes-warning-banner" />
        ))}

        {isEmpty ? (
          <View style={styles.emptyState}>
            <StateView
              illustrationIcon={STATE_COPY.my_recipes_empty.illustrationIcon}
              title={STATE_COPY.my_recipes_empty.title}
              description={STATE_COPY.my_recipes_empty.description}
              primaryAction={{ label: STATE_COPY.my_recipes_empty.primaryActionLabel, onPress: createRecipe }}
              testID="state-view-my_recipes_empty"
            />
          </View>
        ) : (
          <>
            {statusOrder.map((status) => (
              <MyRecipesStatusSection
                key={status}
                status={status}
                recipes={groups[status]}
                onOpenRecipe={openRecipe}
                onDeleteRecipe={openDeleteConfirmation}
              />
            ))}
            <Button tone="secondary" size="sm" onPress={createRecipe} style={styles.newButton} testID="my-recipes-new-button">
              Nova receita
            </Button>
          </>
        )}
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
    paddingHorizontal: layout.screenGutter,
    paddingBottom: layout.tabBarClearance,
  },
  header: {
    paddingTop: spacing.sm + 2,
    gap: 4,
  },
  title: {
    ...typography.displayXs,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
  },
  error: {
    ...typography.bodyMd,
    color: semanticColors.danger,
  },
  emptyState: {
    marginTop: spacing.lg,
    backgroundColor: semanticColors.surface,
    borderRadius: 24,
    paddingVertical: spacing.xl - 2,
    paddingHorizontal: spacing.lg - 2,
  },
  newButton: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
});
