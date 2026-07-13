import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Overline } from '@/components/atoms/overline';
import { Pill } from '@/components/atoms/pill';
import { RecipeGrid } from '@/components/organisms/recipe-grid';
import { SearchField } from '@/components/molecules/search-field';
import { fontFamilies, layout, semanticColors, spacing, typography } from '@/design-system/tokens';
import { SEARCH_FILTERS, useSearchViewModel } from '@/module/recipes/viewModels/use-search-view-model';

export function SearchScreen() {
  const { query, setQuery, recipes, isEmpty, savedIds, toggleSaved, openRecipe } = useSearchViewModel();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Overline>buscar</Overline>
          <SearchField value={query} onChangeText={setQuery} placeholder="o que você quer comer?" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {SEARCH_FILTERS.map((filter) => (
            <Pill key={filter} tone="sand">
              {filter}
            </Pill>
          ))}
        </ScrollView>

        <RecipeGrid recipes={recipes} savedIds={savedIds} onToggleSave={toggleSaved} onOpen={openRecipe} />

        {isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nada por aqui ainda</Text>
            <Text style={styles.emptyBody}>Você pode tentar outra busca.</Text>
          </View>
        ) : null}
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
    gap: spacing.sm,
  },
  filters: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg - 4,
  },
  emptyState: {
    marginHorizontal: spacing.lg - 4,
    backgroundColor: semanticColors.surface,
    borderRadius: 22,
    padding: spacing.xl - 4,
    alignItems: 'center',
    gap: spacing.xs,
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
  },
});
