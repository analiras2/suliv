import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import {
  colors,
  fontFamilies,
  radii,
  recipeGradients,
  semanticColors,
  shadows,
  spacing,
  typography,
} from '@/design-system/tokens';
import type { Recipe } from '@/module/recipes/types';

export type RecipeCardProps = {
  recipe: Recipe;
  saved: boolean;
  onToggleSave: () => void;
  onOpen: () => void;
};

function RecipeCardComponent({ recipe, saved, onToggleSave, onOpen }: RecipeCardProps) {
  return (
    <View style={styles.card}>
      <Pressable onPress={onOpen}>
        <LinearGradient
          colors={recipeGradients[recipe.gradient]}
          style={styles.image}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          {recipe.time ? (
            <View style={styles.timePill}>
              <Icon name="clock" size={11} color={colors.ink700} strokeWidth={2} />
              <Text style={styles.timeLabel}>{recipe.time}</Text>
            </View>
          ) : null}
        </LinearGradient>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {recipe.meta}
          </Text>
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
