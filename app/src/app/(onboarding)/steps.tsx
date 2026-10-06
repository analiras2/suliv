import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingProgressHeader } from '@/components/molecules/onboarding-progress-header';
import { StateView } from '@/components/molecules/state-view';
import { OnboardingAllergiesStep } from '@/components/organisms/onboarding-allergies-step';
import { OnboardingDietStep } from '@/components/organisms/onboarding-diet-step';
import { OnboardingLevelFrequencyStep } from '@/components/organisms/onboarding-level-frequency-step';
import { semanticColors, spacing } from '@/design-system/tokens';
import { analyticsClient } from '@/lib/analytics';
import { STATE_COPY } from '@/lib/state-copy';
import { LAST_STEP, type OnboardingStep } from '@/module/onboarding/types';
import { useOnboardingViewModel } from '@/module/onboarding/viewModels/use-onboarding-view-model';

// Named group: '/' also matches (onboarding)/index, which the root guard keeps mounted
// until the completed profile reaches the session store.
const TABS_ROUTE = '/(tabs)' as Href;
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

        {/* The allergen catalog is unbounded, so the step body has to scroll on its own:
            without this the list grows past the viewport and pushes the footer — and with
            it the only way forward — off screen. Progress header and footer stay fixed. */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          style={styles.scroll}
          testID="onboarding-step-scroll">
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
        </ScrollView>

        {isLastStep && vm.submitStatus === 'error' && (
          <StateView
            illustrationIcon={STATE_COPY.onboarding_submit_error.illustrationIcon}
            title={STATE_COPY.onboarding_submit_error.title}
            description={STATE_COPY.onboarding_submit_error.description}
            primaryAction={{ label: STATE_COPY.onboarding_submit_error.primaryActionLabel, onPress: handleSubmit }}
            testID="state-view-onboarding_submit_error"
          />
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
    gap: spacing.md,
    padding: spacing.lg,
  },
  // `flex: 1` makes the scroll area absorb the leftover height, which is what keeps the
  // footer pinned to the bottom now that the container no longer uses space-between.
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
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
