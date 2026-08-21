import { useCallback } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';

import { RecipeCard } from '@/components/molecules/recipe-card';
import { layout, spacing } from '@/design-system/tokens';
import type { Recipe } from '@/module/recipes/types';

export type GridRecipe = Recipe & { conflictsWithUser?: boolean };

export type RecipeGridProps = {
  recipes: GridRecipe[];
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  onOpen: (id: string) => void;
  scrollEnabled?: boolean;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  testIDPrefix?: string;
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType | React.ReactElement | null;
};

const NUM_COLUMNS = 2;
const DEFAULT_END_REACHED_THRESHOLD = 0.5;

function keyExtractor(recipe: GridRecipe) {
  return recipe.id;
}

export function RecipeGrid({
  recipes,
  savedIds,
  onToggleSave,
  onOpen,
  scrollEnabled = false,
  onEndReached,
  onEndReachedThreshold = DEFAULT_END_REACHED_THRESHOLD,
  testIDPrefix,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
}: RecipeGridProps) {
  const renderItem = useCallback<ListRenderItem<GridRecipe>>(
    ({ item, index }) => (
      <View style={styles.cell} testID={testIDPrefix ? `${testIDPrefix}-${index}` : undefined}>
        <RecipeCard
          recipe={item}
          saved={savedIds.has(item.id)}
          onToggleSave={() => onToggleSave(item.id)}
          onOpen={() => onOpen(item.slug)}
          conflictsWithUser={item.conflictsWithUser}
        />
      </View>
    ),
    [savedIds, onToggleSave, onOpen, testIDPrefix],
  );

  return (
    <FlatList
      testID="recipe-grid-list"
      data={recipes}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      numColumns={NUM_COLUMNS}
      scrollEnabled={scrollEnabled}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={ItemSeparator}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
}

function ItemSeparator() {
  return <View style={{ height: spacing.sm }} />;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenGutter,
  },
  row: {
    gap: spacing.sm,
  },
  // RecipeCard is `flex: 1`, but flex only distributes through a parent that takes part in
  // the row layout. Without this the wrapper falls back to its intrinsic content width, so
  // every card is sized by its own title and the wider ones overflow the row on the right.
  // maxWidth keeps a lone card on an odd last row at column width instead of full bleed.
  cell: {
    flex: 1,
    maxWidth: '50%',
  },
});
