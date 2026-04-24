import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { tokens } from "@suliv/design-system";
import type { FeedTopRecipe } from "../../features/recipes/types/feed";
import {
  formatRecipeMeta,
  formatSavesCount,
} from "../../features/recipes/data/feedPresentation";

const P = tokens.color.primitive;

interface TopRecipeRowProps {
  item: FeedTopRecipe;
  accentColor: string;
  onPress?: () => void;
}

export function TopRecipeRow({ item, accentColor, onPress }: TopRecipeRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`#${item.rank} ${item.title}`}
    >
      <View style={[styles.thumbnail, { backgroundColor: accentColor }]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.thumbnailImage} resizeMode="cover" />
        ) : null}
        <View style={styles.thumbnailOverlay} />
        <Text style={styles.rank}>#{item.rank}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatRecipeMeta(item.totalTimeMin, item.descriptor)}
        </Text>
        <View style={styles.savesRow}>
          <MaterialCommunityIcons name="fire" size={13} color={P.clay[500]} />
          <Text style={styles.savesText}>{formatSavesCount(item.savesCount)}</Text>
        </View>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={18} color={P.ink[300]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    backgroundColor: tokens.color.semantic.surface.elevated,
    borderRadius: tokens.radius.md,
    padding: tokens.space.xs,
    borderWidth: 1,
    borderColor: tokens.color.semantic.border.subtle,
  },
  pressed: {
    opacity: 0.88,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: tokens.radius.sm,
    flexShrink: 0,
    alignItems: "flex-start",
    justifyContent: "flex-end",
    padding: tokens.space["2xs"],
    overflow: "hidden",
    ...tokens.elevation.xs,
  },
  thumbnailImage: {
    ...StyleSheet.absoluteFillObject,
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(34, 24, 18, 0.18)",
  },
  rank: {
    fontSize: 10,
    fontFamily: tokens.typography.family.bold,
    fontWeight: "700",
    color: "rgba(253,251,246,0.9)",
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontFamily: tokens.typography.family.semibold,
    fontWeight: "600",
    color: tokens.color.semantic.text.primary,
    lineHeight: 20,
  },
  meta: {
    fontSize: 12,
    fontFamily: tokens.typography.family.regular,
    color: tokens.color.semantic.text.secondary,
  },
  savesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space["2xs"],
    marginTop: 2,
  },
  savesText: {
    fontSize: 12,
    fontFamily: tokens.typography.family.semibold,
    fontWeight: "600",
    color: P.clay[700],
  },
});
