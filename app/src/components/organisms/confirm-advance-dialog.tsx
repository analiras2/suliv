import { Modal, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';

export type ConfirmAdvanceDialogProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmAdvanceDialog({ visible, onConfirm, onCancel }: ConfirmAdvanceDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay} testID="confirm-advance-dialog">
        <View style={styles.card}>
          <Text style={styles.title}>O timer ainda está rodando</Text>
          <Text style={styles.body}>
            Avançar agora vai cancelar o alerta desse passo. Você pode continuar mesmo assim ou esperar o timer
            terminar.
          </Text>
          <View style={styles.actions}>
            <Button tone="ghost" size="sm" onPress={onCancel} testID="confirm-advance-cancel">
              Esperar timer
            </Button>
            <Button tone="primary" size="sm" onPress={onConfirm} testID="confirm-advance-confirm">
              Avançar mesmo assim
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: semanticColors.overlayScrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: semanticColors.surfaceRaised,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.titleMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fg,
  },
  body: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
