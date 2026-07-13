import { useMemo } from 'react';

import { useWeekPlanQuery } from '@/module/recipes/queries/use-recipes-query';

export function usePlanViewModel() {
  const weekPlanQuery = useWeekPlanQuery();
  const days = useMemo(() => weekPlanQuery.data ?? [], [weekPlanQuery.data]);

  const completedCount = useMemo(() => days.filter((day) => day.done).length, [days]);
  const progress = days.length > 0 ? completedCount / days.length : 0;

  return {
    isLoading: weekPlanQuery.isLoading,
    days,
    completedCount,
    totalDays: days.length,
    progress,
  };
}
