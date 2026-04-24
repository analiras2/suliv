import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { tokens } from "@suliv/design-system";
import { SectionHeader } from "../molecules/SectionHeader";
import { CategoryBubble } from "../atoms/CategoryBubble";
import type { FeedCategory } from "../../features/recipes/types/feed";
import { getCategoryPresentation } from "../../features/recipes/data/feedPresentation";

interface CategoriesSectionProps {
  categories: FeedCategory[];
  onSeeAll?: () => void;
  onCategoryPress?: (categoryKey: string) => void;
}

export function CategoriesSection({
  categories,
  onSeeAll,
  onCategoryPress,
}: CategoriesSectionProps) {
  if (categories.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <SectionHeader
        kicker="Explorar"
        title="Categorias"
        action="Ver todas"
        onAction={onSeeAll}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {categories.map((category) => {
          const presentation = getCategoryPresentation(category.key);
          return (
          <CategoryBubble
            key={category.key}
            label={presentation.label}
            bgColor={presentation.bgColor}
            iconName={presentation.iconName}
            onPress={() => onCategoryPress?.(category.key)}
          />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: tokens.space.sm,
  },
  scroll: {
    paddingHorizontal: tokens.space.md,
    gap: tokens.space.md,
    paddingBottom: tokens.space["2xs"],
  },
});
