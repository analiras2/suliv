import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';
import type { DraftStep } from '@/module/recipe-authoring/types';

export type RecipeStepFormListProps = {
  steps: DraftStep[];
  onAdd: () => void;
  onUpdate: (index: number, changes: Partial<DraftStep>) => void;
  onRemove: (index: number) => void;
};

export function RecipeStepFormList({ steps, onAdd, onUpdate, onRemove }: RecipeStepFormListProps) {
  return (
    <View style={styles.container} testID="recipe-form-steps">
      {steps.map((step, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.rowHeader}>
            <Text style={styles.stepNumber}>{index + 1}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remover passo"
              onPress={() => onRemove(index)}
              testID={`step-remove-${index}`}>
              <Icon name="close" size={16} color={semanticColors.fgSecondary} />
            </Pressable>
          </View>
          <TextInput
            value={step.description}
            onChangeText={(value) => onUpdate(index, { description: value })}
            placeholder="Descreva esse passo"
            placeholderTextColor={semanticColors.fgTertiary}
            multiline
            style={styles.descriptionInput}
            testID={`step-description-${index}`}
          />
          <TextInput
            value={step.stepTimeSeconds === null ? '' : String(step.stepTimeSeconds)}
            onChangeText={(value) => onUpdate(index, { stepTimeSeconds: value === '' ? null : Number(value) })}
            placeholder="Timer (segundos, opcional)"
            placeholderTextColor={semanticColors.fgTertiary}
            keyboardType="number-pad"
            style={styles.timerInput}
            testID={`step-timer-${index}`}
          />
        </View>
      ))}
      <Button tone="secondary" size="sm" onPress={onAdd} testID="step-add">
        + Adicionar passo
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: semanticColors.border,
    paddingBottom: spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepNumber: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fgAccent,
  },
  descriptionInput: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fg,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  timerInput: {
    ...typography.bodySm,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fg,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    width: 180,
  },
});
