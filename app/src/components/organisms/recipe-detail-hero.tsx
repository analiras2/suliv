import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import { Pill } from '@/components/atoms/pill';
import { colors, semanticColors, spacing } from '@/design-system/tokens';
import type { Difficulty, DietPreference, TimeBucket } from '@/module/recipes/types';

export type RecipeDetailHeroProps = {
  coverImageUrl: string | null;
  timeBucket: TimeBucket;
  difficulty: Difficulty;
  dietPreference: DietPreference;
  servings: number;
  averageRating: number | null;
  ratingCount: number;
  saved: boolean;
  onBack: () => void;
  onToggleSave: () => void;
};

const HERO_HEIGHT = 280;

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

const DIET_LABELS: Record<DietPreference, string> = {
  vegano: 'vegano',
  vegetariano: 'vegetariano',
  flexitariano: 'flexitariano',
};

export function RecipeDetailHero({
  coverImageUrl,
  timeBucket,
  difficulty,
  dietPreference,
  servings,
  averageRating,
  ratingCount,
  saved,
  onBack,
  onToggleSave,
}: RecipeDetailHeroProps) {
  return (
    <View style={styles.hero}>
      {coverImageUrl ? (
        <Image source={{ uri: coverImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallback]} />
      )}

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
        <Pill tone="clay">{DIET_LABELS[dietPreference]}</Pill>
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
