import { useCallback } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';

import { RecipeCard } from '@/components/molecules/recipe-card';
import { spacing } from '@/design-system/tokens';
import type { Recipe } from '@/module/recipes/types';

export type TopOfWeekListProps = {
  recipes: Recipe[];
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  onOpen: (id: string) => void;
  scrollEnabled?: boolean;
  testIDPrefix?: string;
};

function keyExtractor(recipe: Recipe) {
  return recipe.id;
}

export function TopOfWeekList({
  recipes,
  savedIds,
  onToggleSave,
  onOpen,
  scrollEnabled = false,
  testIDPrefix,
}: TopOfWeekListProps) {
  const renderItem = useCallback<ListRenderItem<Recipe>>(
    ({ item, index }) => (
      <View testID={testIDPrefix ? `${testIDPrefix}-${index}` : undefined}>
        <RecipeCard
          recipe={item}
          saved={savedIds.has(item.id)}
          onToggleSave={() => onToggleSave(item.id)}
          onOpen={() => onOpen(item.id)}
        />
      </View>
    ),
    [savedIds, onToggleSave, onOpen, testIDPrefix],
  );

  return (
    <FlatList
      data={recipes}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      scrollEnabled={scrollEnabled}
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
});
