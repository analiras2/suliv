import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { Overline } from '@/components/atoms/overline';
import { RecipeGrid } from '@/components/organisms/recipe-grid';
import { colors, fontFamilies, layout, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useSavedViewModel } from '@/module/recipes/viewModels/use-saved-view-model';

export function SavedScreen() {
  const { savedRecipes, toggleSaved, openRecipe, goExplore } = useSavedViewModel();

  if (savedRecipes.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Overline>salvos</Overline>
          <Text style={styles.title}>Salva para fazer depois</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Icon name="leaf" size={28} color={colors.moss500} strokeWidth={1.6} />
          </View>
          <Text style={styles.emptyTitle}>Ainda nada salvo</Text>
          <Text style={styles.emptyBody}>
            Quando encontrar uma receita que te chama, é só tocar no coração. Ela fica esperando.
          </Text>
          <Button tone="primary" size="sm" onPress={goExplore} style={styles.emptyButton}>
            Explorar receitas
          </Button>
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
    paddingHorizontal: spacing.lg - 4,
    paddingTop: spacing.sm + 2,
    gap: 4,
  },
  title: {
    ...typography.displayXs,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
  },
  emptyState: {
    marginHorizontal: spacing.lg - 4,
    marginTop: spacing.lg,
    backgroundColor: semanticColors.surface,
    borderRadius: 24,
    paddingVertical: spacing.xl - 2,
    paddingHorizontal: spacing.lg - 2,
    alignItems: 'center',
    gap: spacing.sm - 2,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: colors.moss50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.displayXs,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
  },
  emptyBody: {
    ...typography.bodySm,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  emptyButton: {
    marginTop: 6,
  },
});
