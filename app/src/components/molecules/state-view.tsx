import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { Icon, type IconName } from '@/components/atoms/icon';
import { fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';

export type StateViewAction = {
  label: string;
  onPress: () => void;
};

export type StateViewProps = {
  illustrationIcon: IconName;
  title: string;
  description: string;
  primaryAction?: StateViewAction;
  secondaryAction?: StateViewAction;
  testID?: string;
};

export function StateView({
  illustrationIcon,
  title,
  description,
  primaryAction,
  secondaryAction,
  testID,
}: StateViewProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.iconCircle}>
        <Icon name={illustrationIcon} size={32} color={semanticColors.fgBrand} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {primaryAction ? (
        <Button
          tone="primary"
          onPress={primaryAction.onPress}
          style={styles.action}
          testID="state-view-primary-action">
          {primaryAction.label}
        </Button>
      ) : null}
      {secondaryAction ? (
        <Button
          tone="ghost"
          onPress={secondaryAction.onPress}
          style={styles.action}
          testID="state-view-secondary-action">
          {secondaryAction.label}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    backgroundColor: semanticColors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.titleMd,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
    textAlign: 'center',
  },
  description: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgSecondary,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.xs,
  },
});
