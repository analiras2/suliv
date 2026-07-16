import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryRow } from '@/components/organisms/category-row';
import { FeedOfflineView } from '@/components/organisms/feed-offline-view';
import { RecipeCarousel } from '@/components/organisms/recipe-carousel';
import { TopOfWeekList } from '@/components/organisms/top-of-week-list';
import { SectionHeader } from '@/components/molecules/section-header';
import { layout, semanticColors, spacing } from '@/design-system/tokens';
import { useFeedAnalytics } from '@/module/feed/viewModels/use-feed-analytics';
import { useFeedViewModel } from '@/module/feed/viewModels/use-feed-view-model';
import { useOfflineMode } from '@/module/splash/context/offline-mode-context';

export function HomeScreen() {
  const isOffline = useOfflineMode();
  const feed = useFeedViewModel();
  useFeedAnalytics(feed);

  if (isOffline) {
    return <FeedOfflineView />;
  }

  if (feed.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loading} testID="home-screen-loading">
          <ActivityIndicator color={semanticColors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  const firstCategoryKey = feed.categorySections[0]?.category.key;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.stack}>
          <SectionHeader overline="para você" title="Selecionadas para você" />
          <RecipeCarousel
            recipes={feed.selectedForYou}
            savedIds={feed.savedIds}
            onToggleSave={feed.toggleSaved}
            onOpen={(id) => feed.openRecipe(id, 'feed_selecionadas')}
            testIDPrefix="selected-for-you-card"
          />
        </View>

        <View style={styles.stack}>
          <SectionHeader
            overline="explorar"
            title="Categorias"
            actionLabel="Ver tudo"
            onActionPress={() => feed.openVerTudo('categoria', firstCategoryKey)}
            testID="categories-ver-tudo-button"
          />
          <CategoryRow categories={feed.categorySections.map((section) => section.category)} />
        </View>

        <View style={styles.stack}>
          <SectionHeader
            overline="popular"
            title="Top da semana"
            actionLabel="Ver tudo"
            onActionPress={() => feed.openVerTudo('top_semana')}
            testID="top-of-week-ver-tudo-button"
          />
          <TopOfWeekList
            recipes={feed.topOfWeek}
            savedIds={feed.savedIds}
            onToggleSave={feed.toggleSaved}
            onOpen={(id) => feed.openRecipe(id, 'feed_top_semana')}
            testIDPrefix="top-of-week-card"
          />
        </View>
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
    gap: spacing.lg - 6,
    paddingBottom: layout.tabBarClearance,
  },
  stack: {
    gap: spacing.md - 2,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
