import type { Category, Recipe } from '@/module/recipes/types';

export type RecipeSummary = Recipe;

export interface CategorySection {
  category: Category;
  recipes: RecipeSummary[];
}

export interface FeedResponse {
  selectedForYou: RecipeSummary[];
  categories: CategorySection[];
  topOfWeek: RecipeSummary[];
}
