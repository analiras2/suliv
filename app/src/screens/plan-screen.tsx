import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View, type ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Overline } from '@/components/atoms/overline';
import { DayItem } from '@/components/molecules/day-item';
import { WeekProgressBar } from '@/components/organisms/week-progress-bar';
import { fontFamilies, layout, semanticColors, spacing, typography } from '@/design-system/tokens';
import type { DayPlanEntry } from '@/module/recipes/types';
import { usePlanViewModel } from '@/module/recipes/viewModels/use-plan-view-model';

function keyExtractor(entry: DayPlanEntry) {
  return entry.day;
}

export function PlanScreen() {
  const { days, completedCount, totalDays, progress } = usePlanViewModel();

  const renderItem = useCallback<ListRenderItem<DayPlanEntry>>(({ item }) => <DayItem {...item} />, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={days}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <Overline>sua semana</Overline>
              <Text style={styles.title}>
                {completedCount} de {totalDays} dias, do seu jeito
              </Text>
            </View>
            <WeekProgressBar
              progress={progress}
              helperText="Sem pressão — você pode ajustar qualquer dia, trocar ou pular."
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

function ItemSeparator() {
  return <View style={{ height: spacing.xs }} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: semanticColors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg - 4,
    paddingBottom: layout.tabBarClearance,
  },
  header: {
    gap: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.md,
  },
  titleGroup: {
    gap: 4,
  },
  title: {
    ...typography.displayXs,
    fontFamily: fontFamilies.display,
    color: semanticColors.fg,
  },
});
