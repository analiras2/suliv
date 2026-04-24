import React from "react";
import { StyleSheet, View } from "react-native";
import { tokens } from "@suliv/design-system";
import { SectionHeader } from "../molecules/SectionHeader";
import { TopRecipeRow } from "../molecules/TopRecipeRow";
import type { FeedTopRecipe } from "../../features/recipes/types/feed";
import { getAccentColor } from "../../features/recipes/data/feedPresentation";

interface TopRecipesSectionProps {
  items: FeedTopRecipe[];
  onSeeAll?: () => void;
  onRecipePress?: (id: string) => void;
}

export function TopRecipesSection({
  items,
  onSeeAll,
  onRecipePress,
}: TopRecipesSectionProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <SectionHeader
        kicker="Comunidade"
        title="Top da semana"
        action="Ver tudo"
        onAction={onSeeAll}
      />
      <View style={styles.list}>
        {items.map((item, index) => (
          <TopRecipeRow
            key={item.id}
            item={item}
            accentColor={getAccentColor(index, item.category)}
            onPress={() => onRecipePress?.(item.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: tokens.space.sm,
  },
  list: {
    paddingHorizontal: tokens.space.md,
    gap: tokens.space.xs,
  },
});
