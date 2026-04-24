import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "@suliv/design-system";
import type { FeedNewsItem } from "../../features/recipes/types/feed";
import { formatNewsDate } from "../../features/recipes/data/feedPresentation";

const P = tokens.color.primitive;

interface NewsCardProps {
  item: FeedNewsItem;
  accentColor: string;
  onPress?: () => void;
}

export function NewsCard({ item, accentColor, onPress }: NewsCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={[styles.thumbnail, { backgroundColor: accentColor }]}>
        {item.coverImageUrl ? (
          <Image source={{ uri: item.coverImageUrl }} style={styles.thumbnailImage} resizeMode="cover" />
        ) : null}
        <View style={styles.shimmer} />
      </View>

      <View style={styles.body}>
        <View>
          <Text style={styles.kicker}>{item.kicker.toUpperCase()}</Text>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{formatNewsDate(item.publishedAt)}</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>{item.readTimeMin} min de leitura</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: tokens.color.semantic.surface.elevated,
    borderRadius: tokens.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: tokens.color.semantic.border.subtle,
    ...tokens.elevation.xs,
  },
  pressed: {
    opacity: 0.88,
  },
  thumbnail: {
    width: 92,
    flexShrink: 0,
  },
  thumbnailImage: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  body: {
    flex: 1,
    minWidth: 0,
    padding: tokens.space.sm,
    justifyContent: "space-between",
    gap: tokens.space.xs,
  },
  kicker: {
    fontSize: 10,
    fontFamily: tokens.typography.family.semibold,
    fontWeight: "600",
    letterSpacing: 1.4,
    color: P.clay[600],
    marginBottom: tokens.space["2xs"],
  },
  title: {
    fontSize: 15,
    fontFamily: tokens.typography.family.semibold,
    fontWeight: "600",
    color: tokens.color.semantic.text.primary,
    lineHeight: 20,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.xs,
  },
  metaText: {
    fontSize: 12,
    fontFamily: tokens.typography.family.regular,
    color: tokens.color.semantic.text.secondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: P.ink[300],
  },
});
