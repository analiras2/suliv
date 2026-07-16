import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingProgressHeader } from '@/components/molecules/onboarding-progress-header';
import { OnboardingAllergiesStep } from '@/components/organisms/onboarding-allergies-step';
import { OnboardingDietStep } from '@/components/organisms/onboarding-diet-step';
import { OnboardingLevelFrequencyStep } from '@/components/organisms/onboarding-level-frequency-step';
import { semanticColors, spacing, typography } from '@/design-system/tokens';
import { analyticsClient } from '@/lib/analytics';
import { LAST_STEP, type OnboardingStep } from '@/module/onboarding/types';
import { useOnboardingViewModel } from '@/module/onboarding/viewModels/use-onboarding-view-model';

const TABS_ROUTE = '/' as Href;
const TOTAL_STEPS = 3;

const STEP_LABELS: Record<OnboardingStep, string> = {
  0: 'PASSO 1 — PREFERÊNCIA BASE',
  1: 'PASSO 2 — ALERGIAS',
  2: 'PASSO 3 — ROTINA',
};

export default function OnboardingScreen() {
  const vm = useOnboardingViewModel();
  const router = useRouter();
  const hasStarted = useRef(false);
  const hasAttemptedSubmit = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    analyticsClient.track('onboarding_started', {});
  }, []);

  useEffect(() => {
    if (!hasAttemptedSubmit.current) return;
    if (vm.submitStatus === 'idle') {
      hasAttemptedSubmit.current = false;
      router.replace(TABS_ROUTE);
    } else if (vm.submitStatus === 'error') {
      hasAttemptedSubmit.current = false;
    }
  }, [router, vm.submitStatus]);

  const handleSubmit = () => {
    hasAttemptedSubmit.current = true;
    vm.submit();
  };

  const isLastStep = vm.step === LAST_STEP;
  const isSubmitting = vm.submitStatus === 'submitting';
  const isConfirmDisabled = !vm.isStepValid || isSubmitting;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <OnboardingProgressHeader currentStep={vm.step} totalSteps={TOTAL_STEPS} label={STEP_LABELS[vm.step]} />

        {vm.step === 0 && <OnboardingDietStep dietPreference={vm.dietPreference} onSelect={vm.setDietPreference} />}
        {vm.step === 1 && (
          <OnboardingAllergiesStep
            allergenIds={vm.allergenIds}
            newTerms={vm.newTerms}
            onAddNewTerm={vm.addNewTerm}
            onClearAllergies={vm.clearAllergies}
            onToggleAllergen={vm.toggleAllergen}
          />
        )}
        {vm.step === 2 && (
          <OnboardingLevelFrequencyStep
            cookingFrequency={vm.cookingFrequency}
            cookingLevel={vm.cookingLevel}
            onSelectFrequency={vm.setCookingFrequency}
            onSelectLevel={vm.setCookingLevel}
          />
        )}

        {isLastStep && vm.submitStatus === 'error' && (
          <View style={styles.errorGroup}>
            <Text style={styles.errorMessage} testID="onboarding-error-message">
              Não foi possível concluir seu cadastro agora. Tente novamente.
            </Text>
            <Pressable
              accessibilityLabel="Tentar novamente"
              accessibilityRole="button"
              onPress={handleSubmit}
              style={styles.secondaryButton}
              testID="onboarding-retry-button">
              <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.footer}>
          {vm.step > 0 && (
            <Pressable
              accessibilityLabel="Voltar"
              accessibilityRole="button"
              onPress={vm.back}
              style={styles.secondaryButton}
              testID="onboarding-back-button">
              <Text style={styles.secondaryButtonText}>Voltar</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityLabel={isLastStep ? 'Concluir' : 'Continuar'}
            accessibilityRole="button"
            disabled={isConfirmDisabled}
            onPress={isLastStep ? handleSubmit : vm.next}
            style={[styles.button, isConfirmDisabled && styles.disabled]}
            testID={isLastStep ? 'onboarding-submit-button' : 'onboarding-continue-button'}>
            {isSubmitting ? (
              <ActivityIndicator color={semanticColors.brandOn} />
            ) : (
              <Text style={styles.buttonText}>{isLastStep ? 'Concluir' : 'Continuar'}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  errorGroup: {
    gap: spacing.sm,
  },
  errorMessage: {
    ...typography.bodyMd,
    color: semanticColors.danger,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  button: {
    backgroundColor: semanticColors.brand,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: semanticColors.brandOn,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: semanticColors.surface,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: semanticColors.fg,
    fontSize: 16,
    fontWeight: '600',
  },
});
