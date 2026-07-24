import { WEEK_PLAN } from '@/module/recipes/data/mock-recipes';
import type { DayPlanEntry } from '@/module/recipes/types';

export async function fetchWeekPlan(): Promise<DayPlanEntry[]> {
  return WEEK_PLAN;
}
