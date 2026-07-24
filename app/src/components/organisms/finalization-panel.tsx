import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { RatingStarsPicker } from '@/components/molecules/rating-stars-picker';
import { colors, fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';

export type FinalizationPanelProps = {
  isSaved: boolean;
  onRate: (stars: number) => void;
  onToggleSave: () => void;
  onShare: () => void;
};

export function FinalizationPanel({ isSaved, onRate, onToggleSave, onShare }: FinalizationPanelProps) {
  return (
    <View style={styles.panel} testID="finalization-panel">
      <View style={styles.iconWrap}>
        <Icon name="check" size={28} color={colors.moss700} strokeWidth={2.2} />
      </View>
      <Text style={styles.title}>Prontinho!</Text>
      <Text style={styles.body}>Sua receita está pronta. O que você achou do preparo?</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Avaliar</Text>
        <RatingStarsPicker onRate={onRate} />
      </View>

      <View style={styles.actions}>
        <Button
          tone={isSaved ? 'accent' : 'secondary'}
          size="md"
          onPress={onToggleSave}
          testID="finalization-favorite-button"
          icon={<Icon name="heart" size={16} color={isSaved ? colors.sand25 : colors.clay600} filled={isSaved} />}>
          {isSaved ? 'Favoritado' : 'Favoritar'}
        </Button>
        <Button
          tone="secondary"
          size="md"
          onPress={onShare}
          testID="finalization-share-button"
          icon={<Icon name="share" size={16} color={colors.ink900} />}>
          Compartilhar
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: semanticColors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.titleLg,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fg,
  },
  body: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgSecondary,
    textAlign: 'center',
  },
  section: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  sectionLabel: {
    ...typography.labelMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fgSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
