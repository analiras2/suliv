import type { recipeGradients } from '@/design-system/tokens';

export type RecipeGradientKey = keyof typeof recipeGradients;

export interface Recipe {
  id: string;
  title: string;
  meta: string;
  time: string;
  gradient: RecipeGradientKey;
  servings: number;
  proteinGrams: number;
  kcal: number;
  description: string;
  ingredients: string[];
}

export interface DayPlanEntry {
  day: string;
  label: string;
  recipe: { title: string; meta: string };
  done: boolean;
}

export interface Category {
  id: string;
  label: string;
  gradient: RecipeGradientKey;
}
