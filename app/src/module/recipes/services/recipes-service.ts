import { CATEGORIES, RECIPES, WEEK_PLAN } from '@/module/recipes/data/mock-recipes';
import type { Category, DayPlanEntry, Recipe } from '@/module/recipes/types';

export async function fetchRecipes(): Promise<Recipe[]> {
  return RECIPES;
}

export async function fetchRecipeById(id: string): Promise<Recipe | undefined> {
  return RECIPES.find((recipe) => recipe.id === id);
}

export async function fetchCategories(): Promise<Category[]> {
  return CATEGORIES;
}

export async function fetchWeekPlan(): Promise<DayPlanEntry[]> {
  return WEEK_PLAN;
}
