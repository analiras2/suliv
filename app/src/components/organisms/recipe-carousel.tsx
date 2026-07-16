import { useCallback } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';

import { RecipeCard } from '@/components/molecules/recipe-card';
import { spacing } from '@/design-system/tokens';
import type { Recipe } from '@/module/recipes/types';

export type RecipeCarouselProps = {
  recipes: Recipe[];
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  onOpen: (id: string) => void;
  testIDPrefix?: string;
};

const CARD_WIDTH = 168;

function keyExtractor(recipe: Recipe) {
  return recipe.id;
}

export function RecipeCarousel({ recipes, savedIds, onToggleSave, onOpen, testIDPrefix }: RecipeCarouselProps) {
  const renderItem = useCallback<ListRenderItem<Recipe>>(
    ({ item, index }) => (
      <View style={styles.card} testID={testIDPrefix ? `${testIDPrefix}-${index}` : undefined}>
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
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={ItemSeparator}
    />
  );
}

function ItemSeparator() {
  return <View style={{ width: spacing.sm }} />;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg - 4,
  },
  card: {
    width: CARD_WIDTH,
  },
});
