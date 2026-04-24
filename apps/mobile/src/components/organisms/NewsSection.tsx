import React from "react";
import { StyleSheet, View } from "react-native";
import { tokens } from "@suliv/design-system";
import { SectionHeader } from "../molecules/SectionHeader";
import { NewsCard } from "../molecules/NewsCard";
import type { FeedNewsItem } from "../../features/recipes/types/feed";
import { getAccentColor } from "../../features/recipes/data/feedPresentation";

interface NewsSectionProps {
  items: FeedNewsItem[];
  onSeeAll?: () => void;
  onItemPress?: (slug: string) => void;
}

export function NewsSection({ items, onSeeAll, onItemPress }: NewsSectionProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <SectionHeader
        kicker="Suliv mag"
        title="Notícias"
        action="Ver tudo"
        onAction={onSeeAll}
      />
      <View style={styles.list}>
        {items.map((item, index) => (
          <NewsCard
            key={item.id}
            item={item}
            accentColor={getAccentColor(index)}
            onPress={() => onItemPress?.(item.slug)}
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
    gap: tokens.space.sm,
  },
});
