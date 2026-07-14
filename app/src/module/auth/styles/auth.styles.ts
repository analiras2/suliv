import { StyleSheet } from 'react-native';

import { fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';

export const authStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: semanticColors.bg },
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.lg },
  eyebrow: {
    fontFamily: fontFamilies.sansSemibold,
    ...typography.overline,
    color: semanticColors.fgBrand,
    textTransform: 'uppercase',
  },
  title: { fontFamily: fontFamilies.display, ...typography.displayLg, color: semanticColors.fg },
  description: { fontFamily: fontFamilies.sans, ...typography.bodyMd, color: semanticColors.fgSecondary },
  field: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: radii.md,
    backgroundColor: semanticColors.surface,
    paddingHorizontal: spacing.md,
    fontFamily: fontFamilies.sans,
    ...typography.bodyMd,
    color: semanticColors.fg,
  },
  button: {
    minHeight: 52,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: semanticColors.brand,
  },
  buttonSecondary: { backgroundColor: semanticColors.surface, borderWidth: 1, borderColor: semanticColors.border },
  buttonText: { fontFamily: fontFamilies.sansSemibold, ...typography.labelLg, color: semanticColors.brandOn },
  buttonTextSecondary: { color: semanticColors.fg },
  socialGroup: { gap: spacing.sm },
  divider: { height: 1, backgroundColor: semanticColors.border },
  feedback: { fontFamily: fontFamilies.sans, ...typography.bodySm, color: semanticColors.fgSecondary },
  error: { color: semanticColors.danger },
  disabled: { opacity: 0.55 },
});
