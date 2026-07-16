import { RECIPES, WEEK_PLAN } from '@/module/recipes/data/mock-recipes';
import type { DayPlanEntry } from '@/module/recipes/types';

export async function fetchRecipeById(id: string) {
  return RECIPES.find((recipe) => recipe.id === id);
}

export async function fetchWeekPlan(): Promise<DayPlanEntry[]> {
  return WEEK_PLAN;
}
