import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StateView } from '@/components/molecules/state-view';
import { Overline } from '@/components/atoms/overline';
import { RecipeGrid } from '@/components/organisms/recipe-grid';
import { fontFamilies, layout, semanticColors, spacing, typography } from '@/design-system/tokens';
import { STATE_COPY } from '@/lib/state-copy';
import { useSavedViewModel } from '@/module/recipes/viewModels/use-saved-view-model';

export function SavedScreen() {
  const { savedRecipes, toggleSaved, openRecipe, goExplore } = useSavedViewModel();

  if (savedRecipes.length === 0) {
    const copy = STATE_COPY.favorites_empty;
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Overline>salvos</Overline>
          <Text style={styles.title}>Salva para fazer depois</Text>
        </View>
        <View style={styles.emptyState}>
          <StateView
            illustrationIcon={copy.illustrationIcon}
            title={copy.title}
            description={copy.description}
            primaryAction={{ label: copy.primaryActionLabel, onPress: goExplore }}
            testID="state-view-favorites_empty"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Overline>salvos</Overline>
          <Text style={styles.title}>{savedRecipes.length} esperando você</Text>
        </View>
        <RecipeGrid recipes={savedRecipes} savedIds={new Set(savedRecipes.map((r) => r.id))} onToggleSave={toggleSaved} onOpen={openRecipe} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  content: {
    gap: spacing.md - 2,
    paddingBottom: layout.tabBarClearance,
  },
  header: {
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing.sm + 2,
    gap: 4,
  },
  title: {
    ...typography.displayXs,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
  },
  emptyState: {
    marginHorizontal: layout.screenGutter,
    marginTop: spacing.lg,
    backgroundColor: semanticColors.surface,
    borderRadius: 24,
    paddingVertical: spacing.xl - 2,
    paddingHorizontal: spacing.lg - 2,
  },
});
