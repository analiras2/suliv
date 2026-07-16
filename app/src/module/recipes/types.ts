import type { recipeGradients } from '@/design-system/tokens';

export type RecipeGradientKey = keyof typeof recipeGradients;

export type RecipeCategoryKey =
  | 'cafe_da_manha'
  | 'almoco_jantar'
  | 'lanche'
  | 'sobremesa'
  | 'bebida'
  | 'molhos_acompanhamentos';

export type TimeBucket = 'ate_15' | 'quinze_30' | 'trinta_60' | 'sessenta_mais';

export type Difficulty = 'iniciante' | 'intermediario' | 'avancado';

export type DietPreference = 'vegano' | 'vegetariano' | 'flexitariano';

export interface Category {
  id: string;
  key: RecipeCategoryKey;
  label: string;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  category: Category;
  timeBucket: TimeBucket;
  difficulty: Difficulty;
  dietPreference: DietPreference;
}

export interface DayPlanEntry {
  day: string;
  label: string;
  recipe: { title: string; meta: string };
  done: boolean;
}
