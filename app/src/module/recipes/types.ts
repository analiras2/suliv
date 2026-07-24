import type { recipeGradients } from '@/design-system/tokens';
import type { RecipeIngredientDto } from '@/module/recipes/utils/scale-ingredients';

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

export type RecipeStatus = 'rascunho' | 'em_analise' | 'aprovada' | 'precisa_de_ajustes' | 'removida';

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

export interface RecipeStepDto {
  order: number;
  description: string;
  stepTimeSeconds: number | null;
}

export interface RecipeDetail extends Recipe {
  description: string;
  servings: number;
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
  conflictsWithUser?: boolean;
  conflictingAllergens?: string[];
  isFavorited?: boolean;
  status?: RecipeStatus;
  averageRating: number | null;
  ratingCount: number;
}

export interface DayPlanEntry {
  day: string;
  label: string;
  recipe: { title: string; meta: string };
  done: boolean;
}
