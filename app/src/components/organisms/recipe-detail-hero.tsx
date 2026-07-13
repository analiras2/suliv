import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import { colors, recipeGradients, spacing } from '@/design-system/tokens';
import type { RecipeGradientKey } from '@/module/recipes/types';

export type RecipeDetailHeroProps = {
  gradient: RecipeGradientKey;
  saved: boolean;
  onBack: () => void;
  onToggleSave: () => void;
};

const HERO_HEIGHT = 320;

export function RecipeDetailHero({ gradient, saved, onBack, onToggleSave }: RecipeDetailHeroProps) {
  return (
    <LinearGradient
      colors={recipeGradients[gradient]}
      style={styles.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}>
      <View style={styles.chrome}>
        <Pressable onPress={onBack} style={styles.chromeButton} hitSlop={8}>
          <Icon name="back" size={18} color={colors.ink900} />
        </Pressable>
        <View style={styles.chromeGroup}>
          <Pressable style={styles.chromeButton} hitSlop={8}>
            <Icon name="share" size={18} color={colors.ink900} />
          </Pressable>
          <Pressable
            onPress={onToggleSave}
            style={[styles.chromeButton, saved && styles.chromeButtonActive]}
            hitSlop={8}>
            <Icon name="heart" size={18} color={saved ? colors.white : colors.clay600} filled={saved} strokeWidth={1.8} />
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: HERO_HEIGHT,
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
});
