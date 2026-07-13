import { useQuery } from '@tanstack/react-query';

import { fetchCategories, fetchRecipes, fetchWeekPlan } from '@/module/recipes/services/recipes-service';

export function useRecipesQuery() {
  return useQuery({ queryKey: ['recipes'], queryFn: fetchRecipes });
}

export function useCategoriesQuery() {
  return useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
}

export function useWeekPlanQuery() {
  return useQuery({ queryKey: ['week-plan'], queryFn: fetchWeekPlan });
}
