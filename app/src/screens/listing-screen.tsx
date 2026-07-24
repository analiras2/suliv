import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterBar } from '@/components/organisms/filter-bar';
import { RecipeGrid } from '@/components/organisms/recipe-grid';
import { SearchField } from '@/components/molecules/search-field';
import { fontFamilies, layout, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useApprovedAllergensQuery } from '@/module/onboarding/queries/use-approved-allergens-query';
import type { RecipeCategoryKey } from '@/module/recipes/types';
import type { ListingOrigin } from '@/module/search/types';
import { useListingViewModel } from '@/module/search/viewModels/use-listing-view-model';

export type ListingScreenProps = {
  origin?: ListingOrigin;
  categoryKey?: RecipeCategoryKey;
};

export function ListingScreen({ origin, categoryKey }: ListingScreenProps) {
  const listing = useListingViewModel({ origin, categoryKey });
  const { data: allergenOptions } = useApprovedAllergensQuery();

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.title} testID="ver-tudo-title">
          {listing.title}
        </Text>
        <SearchField
          value={listing.query}
          onChangeText={listing.setQuery}
          placeholder="o que você quer comer?"
          testID="listing-search-input"
        />
        <FilterBar filters={listing.filters} onChangeFilter={listing.setFilter} allergenOptions={allergenOptions} />
      </View>
    ),
    [listing.title, listing.query, listing.setQuery, listing.filters, listing.setFilter, allergenOptions],
  );

  const footer = (
    <View style={styles.footer}>
      {listing.isLoading && listing.results.length > 0 ? (
        <ActivityIndicator color={semanticColors.brand} testID="listing-load-more" />
      ) : null}
    </View>
  );

  const empty = listing.isLoading ? (
    <ActivityIndicator style={styles.loading} color={semanticColors.brand} testID="listing-loading" />
  ) : listing.isEmpty ? (
    <View style={styles.emptyState} testID="listing-empty-state">
      <Text style={styles.emptyTitle}>Nenhuma receita encontrada</Text>
      <Text style={styles.emptyBody}>
        Tente ajustar sua busca ou os filtros para descobrir novas receitas.
      </Text>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <RecipeGrid
        recipes={listing.results}
        savedIds={listing.savedIds}
        onToggleSave={listing.toggleSaved}
        onOpen={listing.openRecipe}
        scrollEnabled
        onEndReached={listing.loadMore}
        testIDPrefix="listing-result-card"
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={empty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg - 4,
    paddingTop: spacing.sm + 2,
    gap: spacing.sm,
  },
  title: {
    ...typography.displayXs,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
  },
  loading: {
    marginTop: spacing.xl,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: layout.tabBarClearance,
    alignItems: 'center',
  },
  emptyState: {
    marginHorizontal: spacing.lg - 4,
    marginTop: spacing.md,
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
    textAlign: 'center',
  },
});
