import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterBar } from '@/components/organisms/filter-bar';
import { RecipeGrid } from '@/components/organisms/recipe-grid';
import { SearchField } from '@/components/molecules/search-field';
import { SettingsHeader } from '@/components/molecules/settings-header';
import { StateView } from '@/components/molecules/state-view';
import { fontFamilies, layout, semanticColors, spacing, typography } from '@/design-system/tokens';
import { STATE_COPY } from '@/lib/state-copy';
import { useApprovedAllergensQuery } from '@/module/onboarding/queries/use-approved-allergens-query';
import type { RecipeCategoryKey } from '@/module/recipes/types';
import type { ListingOrigin } from '@/module/search/types';
import type { ListingViewModel } from '@/module/search/viewModels/use-listing-view-model';
import { useListingViewModel } from '@/module/search/viewModels/use-listing-view-model';

export type ListingScreenProps = {
  origin?: ListingOrigin;
  categoryKey?: RecipeCategoryKey;
  /**
   * Supplied by routes that are pushed onto the stack, which need a visible way back —
   * the swipe gesture alone is invisible to most users and absent on Android. The search
   * tab is a tab root with nothing behind it and omits this, keeping its scrolling title.
   */
  onBack?: () => void;
};

function getEmptyState(isLoading: boolean, isEmpty: boolean, clearFilters: ListingViewModel['clearFilters']) {
  if (isLoading) {
    return <ActivityIndicator style={styles.loading} color={semanticColors.brand} testID="listing-loading" />;
  }
  if (isEmpty) {
    const copy = STATE_COPY.search_no_results;
    return (
      <View style={styles.emptyState}>
        <StateView
          illustrationIcon={copy.illustrationIcon}
          title={copy.title}
          description={copy.description}
          primaryAction={{ label: copy.primaryActionLabel, onPress: clearFilters }}
          testID="state-view-search_no_results"
        />
      </View>
    );
  }
  return null;
}

export function ListingScreen({ origin, categoryKey, onBack }: ListingScreenProps) {
  const listing = useListingViewModel({ origin, categoryKey });
  const { data: allergenOptions } = useApprovedAllergensQuery();

  const header = useMemo(
    () => (
      <View style={onBack ? styles.headerUnderBar : styles.header}>
        {onBack ? null : (
          <Text style={styles.title} testID="ver-tudo-title">
            {listing.title}
          </Text>
        )}
        <SearchField
          value={listing.query}
          onChangeText={listing.setQuery}
          placeholder="o que você quer comer?"
          testID="listing-search-input"
        />
        <FilterBar filters={listing.filters} onChangeFilter={listing.setFilter} allergenOptions={allergenOptions} />
      </View>
    ),
    [onBack, listing.title, listing.query, listing.setQuery, listing.filters, listing.setFilter, allergenOptions],
  );

  const footer = (
    <View style={styles.footer}>
      {listing.isLoading && listing.results.length > 0 ? (
        <ActivityIndicator color={semanticColors.brand} testID="listing-load-more" />
      ) : null}
    </View>
  );

  const empty = getEmptyState(listing.isLoading, listing.isEmpty, listing.clearFilters);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {onBack ? (
        <SettingsHeader
          title={listing.title}
          onBack={onBack}
          testID="listing-back-button"
          titleTestID="ver-tudo-title"
        />
      ) : null}
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
  // Rendered as the grid's ListHeaderComponent, so it already sits inside the gutter the
  // grid's contentContainerStyle applies. Setting the gutter again here is what pushed the
  // title and search field out of alignment with the cards below them. SettingsHeader, by
  // contrast, sits at screen root and keeps its own gutter.
  header: {
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  // SettingsHeader already provides the top spacing when it is rendered above the list.
  headerUnderBar: {
    paddingBottom: spacing.md,
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
    // ListEmptyComponent renders inside the grid's gutter too — see `header` above.
    marginTop: spacing.md,
    backgroundColor: semanticColors.surface,
    borderRadius: 22,
    padding: spacing.xl - 4,
    alignItems: 'center',
    gap: spacing.xs,
  },
});
