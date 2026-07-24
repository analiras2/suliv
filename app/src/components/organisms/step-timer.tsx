import { useEffect, useReducer } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { colors, fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';
import type { ActiveTimer } from '@/module/guided-cooking/services/guided-cooking-timer-service';
import type { RecipeStepDto } from '@/module/recipes/types';

export type StepTimerProps = {
  step: RecipeStepDto;
  stepIndex: number;
  activeTimer: ActiveTimer | null;
  onStartTimer: (stepIndex: number) => void;
};

function formatRemaining(endsAt: number): string {
  const remainingSeconds = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function StepTimer({ step, stepIndex, activeTimer, onStartTimer }: StepTimerProps) {
  const isThisStepTimer = activeTimer?.stepIndex === stepIndex;
  const [, forceTick] = useReducer((tick: number) => tick + 1, 0);

  useEffect(() => {
    if (!isThisStepTimer) return undefined;
    const interval = setInterval(forceTick, 1000);
    return () => clearInterval(interval);
  }, [isThisStepTimer]);

  if (step.stepTimeSeconds == null) return null;

  if (isThisStepTimer && activeTimer) {
    return (
      <View style={styles.running} testID="step-timer-running">
        <Icon name="clock" size={16} color={colors.moss700} strokeWidth={2} />
        <Text style={styles.runningLabel}>{formatRemaining(activeTimer.endsAt)}</Text>
      </View>
    );
  }

  return (
    <Button
      tone="secondary"
      size="sm"
      testID="step-timer-start-button"
      onPress={() => onStartTimer(stepIndex)}
      icon={<Icon name="clock" size={14} color={colors.moss700} strokeWidth={2} />}>
      Iniciar timer
    </Button>
  );
}

const styles = StyleSheet.create({
  running: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: semanticColors.surfaceTint,
  },
  runningLabel: {
    ...typography.labelLg,
    fontFamily: fontFamilies.sansSemibold,
    color: colors.moss700,
  },
});
