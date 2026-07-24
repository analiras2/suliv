import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import { Pill, type PillTone } from '@/components/atoms/pill';
import { colors, fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';
import type { MyRecipeStatus, MyRecipeSummary } from '@/module/recipe-authoring/types';

const STATUS_LABELS: Record<MyRecipeStatus, string> = {
  rascunho: 'Rascunho',
  em_analise: 'Em análise',
  aprovada: 'Aprovada',
  precisa_de_ajustes: 'Precisa de ajustes',
};

const STATUS_TONES: Record<MyRecipeStatus, PillTone> = {
  rascunho: 'sand',
  em_analise: 'clay',
  aprovada: 'moss',
  precisa_de_ajustes: 'clay',
};

export type MyRecipeRowProps = {
  recipe: MyRecipeSummary;
  editable: boolean;
  onPress: () => void;
  onDelete: () => void;
};

export function MyRecipeRow({ recipe, editable, onPress, onDelete }: MyRecipeRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!editable}
      onPress={onPress}
      style={styles.row}
      testID={`my-recipe-row-${recipe.id}`}>
      <View style={styles.thumb}>
        {recipe.coverImageUrl ? (
          <Image source={{ uri: recipe.coverImageUrl }} style={styles.thumbImage} contentFit="cover" />
        ) : (
          <Icon name="leaf" size={18} color={colors.ink300} />
        )}
      </View>
      <View style={styles.textGroup}>
        <Text style={styles.title} numberOfLines={1}>
          {recipe.title}
        </Text>
        <Pill tone={STATUS_TONES[recipe.status]} size="sm" style={styles.pill}>
          {STATUS_LABELS[recipe.status]}
        </Pill>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Excluir ${recipe.title}`}
        hitSlop={8}
        onPress={onDelete}
        testID={`my-recipe-delete-${recipe.id}`}>
        <Icon name="close" size={18} color={semanticColors.fgSecondary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: semanticColors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  textGroup: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sansMedium,
    color: semanticColors.fg,
  },
  pill: {
    alignSelf: 'flex-start',
  },
});
