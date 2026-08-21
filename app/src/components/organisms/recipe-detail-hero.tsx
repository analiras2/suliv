import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { Icon } from '@/components/atoms/icon';
import { Pill } from '@/components/atoms/pill';
import { colors, semanticColors, spacing } from '@/design-system/tokens';
import type { Difficulty, TimeBucket } from '@/module/recipes/types';

export type RecipeDetailHeroProps = {
  coverImageUrl: string | null;
  timeBucket: TimeBucket;
  difficulty: Difficulty;
  servings: number;
  averageRating: number | null;
  ratingCount: number;
  saved: boolean;
  onBack: () => void;
  onToggleSave: () => void;
  /** Vertical offset of the scroll view this hero sits in, driving the parallax. */
  scrollOffset: SharedValue<number>;
};

const HERO_HEIGHT = 280;
// Below 1 the cover drifts slower than the page, which is what reads as depth. Pulling
// down instead scales the image up so the overscroll never exposes the background.
const PARALLAX_DRIFT = 0.75;
const OVERSCROLL_ZOOM = 2;

const TIME_LABELS: Record<TimeBucket, string> = {
  ate_15: 'até 15 min',
  quinze_30: '15–30 min',
  trinta_60: '30–60 min',
  sessenta_mais: '60+ min',
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  iniciante: 'iniciante',
  intermediario: 'intermediário',
  avancado: 'avançado',
};

export function RecipeDetailHero({
  coverImageUrl,
  timeBucket,
  difficulty,
  servings,
  averageRating,
  ratingCount,
  saved,
  onBack,
  onToggleSave,
  scrollOffset,
}: RecipeDetailHeroProps) {
  const coverStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [-HERO_HEIGHT, 0, HERO_HEIGHT],
          [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * PARALLAX_DRIFT],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          scrollOffset.value,
          [-HERO_HEIGHT, 0],
          [OVERSCROLL_ZOOM, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={styles.hero}>
      <Animated.View style={[StyleSheet.absoluteFill, coverStyle]}>
        {coverImageUrl ? (
          <Image source={{ uri: coverImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fallback]} />
        )}
      </Animated.View>

      <View style={styles.chrome}>
        <Pressable onPress={onBack} style={styles.chromeButton} hitSlop={8}>
          <Icon name="back" size={18} color={colors.ink900} />
        </Pressable>
        <View style={styles.chromeGroup}>
          <Pressable style={styles.chromeButton} hitSlop={8}>
            <Icon name="share" size={18} color={colors.ink900} />
          </Pressable>
          <Pressable
            accessibilityLabel="Favoritar"
            onPress={onToggleSave}
            style={[styles.chromeButton, saved && styles.chromeButtonActive]}
            hitSlop={8}
            testID="recipe-detail-favorite-button">
            <Icon name="heart" size={18} color={saved ? colors.white : colors.clay600} filled={saved} strokeWidth={1.8} />
          </Pressable>
        </View>
      </View>

      <View style={styles.pillRow}>
        <Pill tone="moss" icon={<Icon name="clock" size={11} color={colors.moss800} strokeWidth={2.2} />}>
          {TIME_LABELS[timeBucket]}
        </Pill>
        <Pill tone="sage">{DIFFICULTY_LABELS[difficulty]}</Pill>
        <Pill tone="ink">{servings} porções</Pill>
        <Pill tone="clay" icon={<Icon name="star" size={11} color={colors.clay700} strokeWidth={2.2} filled />}>
          {ratingCount > 0 ? `${averageRating?.toFixed(1)} · ${ratingCount}` : 'Sem avaliações'}
        </Pill>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: HERO_HEIGHT,
    justifyContent: 'space-between',
    // Keeps the drifting/zoomed cover clipped to the hero instead of painting over the
    // rounded body that overlaps it.
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: semanticColors.bgSubtle,
  },
  chrome: {
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chromeGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chromeButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(253,251,246,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chromeButtonActive: {
    backgroundColor: colors.clay600,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
});
