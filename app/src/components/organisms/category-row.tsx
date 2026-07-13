import { useCallback } from 'react';
import { FlatList, StyleSheet, View, type ListRenderItem } from 'react-native';

import { CategoryChip } from '@/components/molecules/category-chip';
import { spacing } from '@/design-system/tokens';
import type { Category } from '@/module/recipes/types';

export type CategoryRowProps = {
  categories: Category[];
};

function keyExtractor(category: Category) {
  return category.id;
}

export function CategoryRow({ categories }: CategoryRowProps) {
  const renderItem = useCallback<ListRenderItem<Category>>(({ item }) => <CategoryChip category={item} />, []);

  return (
    <FlatList
      data={categories}
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
  return <View style={{ width: spacing.md }} />;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg - 4,
    paddingBottom: 4,
  },
});
