import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import { Pill } from '@/components/atoms/pill';
import {
  colors,
  fontFamilies,
  radii,
  semanticColors,
  shadows,
  spacing,
  typography,
} from '@/design-system/tokens';
import type { Recipe, TimeBucket } from '@/module/recipes/types';

export type RecipeCardProps = {
  recipe: Recipe;
  saved: boolean;
  onToggleSave: () => void;
  onOpen: () => void;
  conflictsWithUser?: boolean;
};

const TIME_BUCKET_LABELS: Record<TimeBucket, string> = {
  ate_15: 'até 15 min',
  quinze_30: '15–30 min',
  trinta_60: '30–60 min',
  sessenta_mais: '60+ min',
};

function RecipeCardComponent({ recipe, saved, onToggleSave, onOpen, conflictsWithUser }: RecipeCardProps) {
  return (
    <View style={styles.card}>
      <Pressable onPress={onOpen}>
        <View style={styles.image}>
          {recipe.coverImageUrl ? (
            <Image source={{ uri: recipe.coverImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : null}
          <View style={styles.timePill}>
            <Icon name="clock" size={11} color={colors.ink700} strokeWidth={2} />
            <Text style={styles.timeLabel}>{TIME_BUCKET_LABELS[recipe.timeBucket]}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {recipe.category.label}
          </Text>
          {conflictsWithUser ? (
            <View testID={`recipe-card-conflict-badge-${recipe.id}`}>
              <Pill tone="clay" size="sm">
                Contém restrição
              </Pill>
            </View>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        onPress={onToggleSave}
        style={[styles.saveButton, saved && styles.saveButtonActive]}
        hitSlop={8}>
        <Icon name="heart" size={15} color={saved ? colors.white : colors.clay600} filled={saved} strokeWidth={1.8} />
      </Pressable>
    </View>
  );
}

export const RecipeCard = memo(RecipeCardComponent);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: semanticColors.surface,
    borderRadius: radii.lg + 2,
    overflow: 'hidden',
    ...shadows.sm,
  },
  image: {
    height: 148,
    backgroundColor: semanticColors.bgSubtle,
    justifyContent: 'flex-end',
  },
  saveButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonActive: {
    backgroundColor: colors.clay600,
  },
  timePill: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
  },
  timeLabel: {
    ...typography.caption,
    fontFamily: fontFamilies.sansMedium,
    color: colors.ink700,
  },
  body: {
    paddingTop: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 4,
  },
  title: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fg,
    lineHeight: 20,
  },
  meta: {
    ...typography.bodySm,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgSecondary,
  },
});
