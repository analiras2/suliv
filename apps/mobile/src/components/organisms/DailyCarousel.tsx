import React, { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { tokens } from "@suliv/design-system";
import { DailyRecipeCard } from "../molecules/DailyRecipeCard";
import type { FeedDailyRecipe } from "../../features/recipes/types/feed";
import { getAccentColor } from "../../features/recipes/data/feedPresentation";

const { width: SCREEN_W } = Dimensions.get("window");
const SIDE_PAD = tokens.space.md;
const GAP = tokens.space.sm;
const CARD_W = SCREEN_W * 0.86;
const SNAP_INTERVAL = CARD_W + GAP;

const P = tokens.color.primitive;

interface DailyCarouselProps {
  items: FeedDailyRecipe[];
  onCardPress?: (id: string) => void;
}

export function DailyCarousel({ items, onCardPress }: DailyCarouselProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  if (items.length === 0) return null;

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(x / SNAP_INTERVAL);
    setActiveIdx(nextIndex);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headingRow}>
        <Text style={styles.kicker}>SELECIONADAS PRA VOCÊ</Text>
        <Text style={styles.heading}>
          {`${items.length} receitas de `}
          <Text style={styles.headingAccent}>hoje</Text>
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={[styles.scrollContent, { paddingLeft: SIDE_PAD }]}
        onMomentumScrollEnd={handleMomentumEnd}
      >
        {items.map((item, index) => (
          <View key={item.id} style={styles.cardWrapper}>
            <DailyRecipeCard
              item={item}
              width={CARD_W}
              accentColor={getAccentColor(index, item.category)}
              onPress={() => onCardPress?.(item.id)}
            />
          </View>
        ))}
        {/* Trailing space so last card can snap to start */}
        <View style={{ width: SIDE_PAD }} />
      </ScrollView>

      <View style={styles.dots}>
        {items.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIdx ? styles.dotActive : styles.dotInactive]}
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
  headingRow: {
    paddingHorizontal: tokens.space.md,
  },
  kicker: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: tokens.typography.family.semibold,
    fontWeight: "600",
    letterSpacing: 1.54,
    color: P.moss[600],
    marginBottom: tokens.space["2xs"],
  },
  heading: {
    fontFamily: tokens.typography.family.displayMedium,
    fontSize: 26,
    lineHeight: 29,
    fontWeight: "500",
    letterSpacing: -0.45,
    color: P.ink[900],
  },
  headingAccent: {
    fontFamily: tokens.typography.family.editorialItalic,
    fontStyle: "italic",
    color: P.moss[700],
  },
  scrollContent: {
    flexDirection: "row",
  },
  cardWrapper: {
    marginRight: GAP,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: tokens.radius.pill,
  },
  dotActive: {
    width: 20,
    backgroundColor: P.moss[500],
  },
  dotInactive: {
    width: 6,
    backgroundColor: P.ink[200],
  },
});
