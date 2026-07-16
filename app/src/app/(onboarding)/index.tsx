import { useRouter, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BranchDoodle } from '@/components/atoms/branch-doodle';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { Overline } from '@/components/atoms/overline';
import { SquiggleDoodle } from '@/components/atoms/squiggle-doodle';
import { fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';

const STEPS_ROUTE = '/steps' as Href;

const STEP_ITEMS = ['Preferência alimentar', 'Alergias e restrições', 'Tempo e experiência na cozinha'];

export default function OnboardingWelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.branchDoodle}>
        <BranchDoodle size={72} />
      </View>
      <View style={styles.container}>
        <View style={styles.content}>
          <Overline>bem-vindo à suliv</Overline>
          <Text style={styles.title}>
            Vamos deixar sua cozinha do seu <Text style={styles.emphasis}>jeito</Text>
          </Text>
          <Text style={styles.body}>
            Em poucos passos, vamos entender suas preferências para recomendar receitas que combinam com você.
          </Text>

          <View style={styles.stepList}>
            {STEP_ITEMS.map((item, index) => (
              <View key={item} style={styles.stepItem}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepLabel}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.squiggleDoodle}>
          <SquiggleDoodle size={96} />
        </View>

        <Button
          icon={<Icon color={semanticColors.brandOn} name="arrowRight" size={18} />}
          onPress={() => router.push(STEPS_ROUTE)}
          size="lg"
          style={styles.startButton}
          testID="onboarding-welcome-start-button">
          Começar
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  branchDoodle: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  content: {
    gap: spacing.md,
  },
  title: {
    ...typography.displayMd,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
  },
  emphasis: {
    fontFamily: fontFamilies.displayItalic,
    color: semanticColors.fgBrand,
    fontStyle: 'italic',
  },
  body: {
    ...typography.bodyMd,
    color: semanticColors.fgSecondary,
  },
  stepList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: semanticColors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...typography.labelMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fgBrand,
  },
  stepLabel: {
    ...typography.bodyMd,
    color: semanticColors.fg,
  },
  squiggleDoodle: {
    alignSelf: 'center',
  },
  startButton: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
});
