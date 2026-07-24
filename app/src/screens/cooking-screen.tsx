import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/atoms/button';
import { ConfirmAdvanceDialog } from '@/components/organisms/confirm-advance-dialog';
import { FinalizationPanel } from '@/components/organisms/finalization-panel';
import { StepProgressList } from '@/components/organisms/step-progress-list';
import { StepTimer } from '@/components/organisms/step-timer';
import { UnavailableCookState } from '@/components/organisms/unavailable-cook-state';
import { fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useGuidedCookingViewModel } from '@/module/guided-cooking/viewModels/use-guided-cooking-view-model';

export type CookingScreenProps = {
  slug: string;
};

export function CookingScreen({ slug }: CookingScreenProps) {
  const router = useRouter();
  const vm = useGuidedCookingViewModel(slug);

  if (vm.phase === 'loading') return null;

  if (vm.phase === 'unavailable') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <UnavailableCookState onGoBack={router.back} />
      </SafeAreaView>
    );
  }

  if (vm.phase === 'finished') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FinalizationPanel
          isSaved={vm.isFavorited}
          onRate={vm.rate}
          onToggleSave={vm.toggleFavorite}
          onShare={vm.share}
        />
      </SafeAreaView>
    );
  }

  const currentStep = vm.steps[vm.currentStepIndex];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.currentStep}>
          <Text style={styles.currentStepDescription}>{currentStep?.description}</Text>
          {currentStep ? (
            <StepTimer
              step={currentStep}
              stepIndex={vm.currentStepIndex}
              activeTimer={vm.activeTimer}
              onStartTimer={vm.startTimer}
            />
          ) : null}
        </View>

        <StepProgressList steps={vm.steps} currentStepIndex={vm.currentStepIndex} />

        <Button
          tone="primary"
          size="lg"
          style={styles.advanceButton}
          onPress={vm.requestAdvance}
          testID="cook-advance-button">
          Próximo passo
        </Button>
      </ScrollView>

      <ConfirmAdvanceDialog
        visible={vm.confirmingAdvance}
        onConfirm={vm.confirmAdvance}
        onCancel={vm.cancelAdvanceRequest}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.lg - 2,
    gap: spacing.md,
  },
  currentStep: {
    gap: spacing.sm,
  },
  currentStepDescription: {
    ...typography.titleMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fg,
  },
  advanceButton: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
});
