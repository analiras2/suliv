import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { tokens } from "@suliv/design-system";
import type { FeedDailyRecipe } from "../../features/recipes/types/feed";
import { formatRecipeMeta } from "../../features/recipes/data/feedPresentation";

const SAND = tokens.color.primitive.sand[25];
const FROST = "rgba(253,251,246,0.18)";
const FROST_BORDER = "rgba(253,251,246,0.28)";

interface DailyRecipeCardProps {
  item: FeedDailyRecipe;
  width: number;
  accentColor: string;
  onPress?: () => void;
  onFavorite?: () => void;
}

export function DailyRecipeCard({
  item,
  width,
  accentColor,
  onPress,
  onFavorite,
}: DailyRecipeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: accentColor, width }]}
      accessibilityRole="button"
      accessibilityLabel={`Receita: ${item.title}`}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.backgroundImage} resizeMode="cover" />
      ) : null}
      <View style={styles.imageOverlay} pointerEvents="none" />
      {/* Subtle top-lit shimmer */}
      <View style={styles.shimmer} pointerEvents="none" />

      <View style={styles.topRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{item.tag}</Text>
        </View>
        <Pressable
          onPress={onFavorite}
          style={styles.heartBtn}
          accessibilityRole="button"
          accessibilityLabel="Favoritar receita"
          hitSlop={8}
        >
          <MaterialCommunityIcons name="heart-outline" size={17} color={SAND} />
        </Pressable>
      </View>

      <View>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="clock-outline" size={13} color={SAND} />
          <Text style={styles.metaText}>{formatRecipeMeta(item.totalTimeMin, item.descriptor)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 260,
    borderRadius: tokens.radius.xl,
    overflow: "hidden",
    ...tokens.elevation.lg,
    padding: tokens.space.md,
    justifyContent: "space-between",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30, 20, 12, 0.22)",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  pill: {
    backgroundColor: FROST,
    paddingHorizontal: tokens.space.xs,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: FROST_BORDER,
  },
  pillText: {
    fontSize: 11,
    fontFamily: tokens.typography.family.semibold,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: SAND,
    textTransform: "uppercase",
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.pill,
    backgroundColor: FROST,
    borderWidth: 1,
    borderColor: FROST_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: tokens.typography.family.displayMedium,
    fontSize: 26,
    lineHeight: 29,
    fontWeight: "500",
    letterSpacing: -0.4,
    color: SAND,
    marginBottom: tokens.space.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space["2xs"],
  },
  metaText: {
    fontSize: 13,
    fontFamily: tokens.typography.family.regular,
    color: SAND,
    opacity: 0.92,
  },
});
