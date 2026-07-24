import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { colors, fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';

export type UnavailableCookStateProps = {
  onGoBack: () => void;
};

export function UnavailableCookState({ onGoBack }: UnavailableCookStateProps) {
  return (
    <View style={styles.container} testID="cook-unavailable-state">
      <View style={styles.icon}>
        <Icon name="warning" size={28} color={colors.ink500} strokeWidth={1.6} />
      </View>
      <Text style={styles.title}>Não é possível cozinhar esta receita offline ainda</Text>
      <Text style={styles.body}>
        Abra essa receita uma vez com internet para liberar o preparo guiado offline dela depois.
      </Text>
      <Button tone="primary" size="sm" onPress={onGoBack} style={styles.button}>
        Voltar
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs + 2,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: semanticColors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.titleMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fg,
    textAlign: 'center',
  },
  body: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.sm,
  },
});
