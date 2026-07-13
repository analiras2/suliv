import { useCallback } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';

import { RecipeCard } from '@/components/molecules/recipe-card';
import { spacing } from '@/design-system/tokens';
import type { Recipe } from '@/module/recipes/types';

export type RecipeGridProps = {
  recipes: Recipe[];
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  onOpen: (id: string) => void;
  scrollEnabled?: boolean;
};

const NUM_COLUMNS = 2;

function keyExtractor(recipe: Recipe) {
  return recipe.id;
}

export function RecipeGrid({ recipes, savedIds, onToggleSave, onOpen, scrollEnabled = false }: RecipeGridProps) {
  const renderItem = useCallback<ListRenderItem<Recipe>>(
    ({ item }) => (
      <RecipeCard
        recipe={item}
        saved={savedIds.has(item.id)}
        onToggleSave={() => onToggleSave(item.id)}
        onOpen={() => onOpen(item.id)}
      />
    ),
    [savedIds, onToggleSave, onOpen],
  );

  return (
    <FlatList
      data={recipes}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      numColumns={NUM_COLUMNS}
      scrollEnabled={scrollEnabled}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={ItemSeparator}
    />
  );
}

function ItemSeparator() {
  return <View style={{ height: spacing.sm }} />;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg - 4,
  },
  row: {
    gap: spacing.sm,
  },
});
