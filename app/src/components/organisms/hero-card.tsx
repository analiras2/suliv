import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import { Overline } from '@/components/atoms/overline';
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

export type HeroCardProps = {
  tag?: string;
  title: string;
  emphasis?: string;
  subtitle?: string;
  onOpen?: () => void;
};

function renderTitle(title: string, emphasis?: string) {
  if (!emphasis || !title.includes(emphasis)) {
    return <Text style={styles.title}>{title}</Text>;
  }
  const [before, after] = title.split(emphasis);
  return (
    <Text style={styles.title}>
      {before}
      <Text style={styles.titleEmphasis}>{emphasis}</Text>
      {after}
    </Text>
  );
}

export function HeroCard({ tag, title, emphasis, subtitle, onOpen }: HeroCardProps) {
  return (
    <Pressable onPress={onOpen}>
      <LinearGradient
        colors={recipeGradients.heroMoss}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        {tag ? <Overline color="rgba(250,246,237,0.82)">{tag}</Overline> : null}
        {renderTitle(title, emphasis)}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.ctaButton}>
          <Text style={styles.ctaLabel}>Ver receita</Text>
          <Icon name="arrowRight" size={13} color={colors.ink900} strokeWidth={2.2} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    minHeight: 220,
    padding: spacing.lg - 2,
    paddingBottom: spacing.lg - 2,
    justifyContent: 'flex-end',
    gap: spacing.xs + 2,
    ...shadows.lg,
  },
  title: {
    ...typography.displaySm,
    fontFamily: fontFamilies.display,
    color: semanticColors.fgInverse,
  },
  titleEmphasis: {
    fontFamily: fontFamilies.displayItalic,
    fontStyle: 'italic',
  },
  subtitle: {
    ...typography.bodySm,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgInverse,
    opacity: 0.85,
    maxWidth: 280,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: colors.sand25,
    paddingVertical: 9,
    paddingHorizontal: spacing.md - 2,
    borderRadius: radii.pill,
  },
  ctaLabel: {
    ...typography.labelMd,
    fontFamily: fontFamilies.sansSemibold,
    color: colors.ink900,
  },
});
