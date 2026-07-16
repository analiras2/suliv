import { useQuery } from '@tanstack/react-query';

import { fetchWeekPlan } from '@/module/recipes/services/recipes-service';

export function useWeekPlanQuery() {
  return useQuery({ queryKey: ['week-plan'], queryFn: fetchWeekPlan });
}
