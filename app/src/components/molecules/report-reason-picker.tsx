import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';
import type { ReportReason } from '@/module/recipes/services/reports-service';

export type ReportReasonPickerProps = {
  onSubmit: (reason: ReportReason) => void;
  onCancel: () => void;
};

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'conteudo_inadequado', label: 'Conteúdo inadequado' },
  { value: 'spam', label: 'Spam' },
  { value: 'informacao_incorreta_perigosa', label: 'Informação incorreta ou perigosa' },
  { value: 'discurso_odio_assedio', label: 'Discurso de ódio ou assédio' },
  { value: 'outro', label: 'Outro' },
];

export function ReportReasonPicker({ onSubmit, onCancel }: ReportReasonPickerProps) {
  return (
    <View style={styles.container} testID="report-reason-picker">
      <Text style={styles.title}>Por que você está denunciando este comentário?</Text>
      {REASONS.map((reason) => (
        <Pressable
          key={reason.value}
          onPress={() => onSubmit(reason.value)}
          testID={`report-reason-${reason.value}`}
          style={styles.reasonRow}>
          <Text style={styles.reasonLabel}>{reason.label}</Text>
        </Pressable>
      ))}
      <Button tone="ghost" size="sm" onPress={onCancel} testID="report-reason-cancel">
        Cancelar
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: semanticColors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: semanticColors.border,
    padding: spacing.sm + 2,
    gap: spacing.xs,
  },
  title: {
    ...typography.labelMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fg,
    marginBottom: spacing.xxs,
  },
  reasonRow: {
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: semanticColors.border,
  },
  reasonLabel: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fg,
  },
});
