import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryRow } from '@/components/organisms/category-row';
import { HeroCard } from '@/components/organisms/hero-card';
import { RecipeGrid } from '@/components/organisms/recipe-grid';
import { Greeting } from '@/components/molecules/greeting';
import { SearchField } from '@/components/molecules/search-field';
import { SectionHeader } from '@/components/molecules/section-header';
import { layout, semanticColors, spacing } from '@/design-system/tokens';
import { useHomeViewModel } from '@/module/recipes/viewModels/use-home-view-model';

export function HomeScreen() {
  const { recipes, categories, savedIds, toggleSaved, openRecipe } = useHomeViewModel();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Greeting name="Ana" />

        <View style={styles.section}>
          <SearchField />
        </View>

        <View style={styles.section}>
          <HeroCard
            tag="Para esta semana"
            title="mais grão-de-bico, sem susto"
            emphasis="sem susto"
            subtitle="5 receitas fáceis pra você trocar a proteína do dia sem complicar."
          />
        </View>

        <View style={styles.stack}>
          <SectionHeader overline="explorar" title="Categorias" actionLabel="Ver tudo" />
          <CategoryRow categories={categories} />
        </View>

        <View style={styles.stack}>
          <SectionHeader overline="receitas" title="Pensado pra hoje" actionLabel="Ver tudo" />
          <RecipeGrid recipes={recipes} savedIds={savedIds} onToggleSave={toggleSaved} onOpen={openRecipe} />
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
  section: {
    paddingHorizontal: spacing.lg - 4,
  },
  stack: {
    gap: spacing.md - 2,
  },
});
