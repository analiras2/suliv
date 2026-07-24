import type { Difficulty, DietPreference, RecipeStatus } from '@/module/recipes/types';

export type IngredientUnit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'unidade'
  | 'xicara'
  | 'colher_sopa'
  | 'colher_cha'
  | 'pitada'
  | 'a_gosto';

export interface DraftIngredient {
  name: string;
  quantity: number | null;
  unit: IngredientUnit;
  scalesWithServings: boolean;
  order: number;
}

export interface DraftStep {
  order: number;
  description: string;
  stepTimeSeconds: number | null;
}

export interface RecipeDraft {
  id: string; // client-generated on creation, becomes the real Recipe.id on first sync
  title: string;
  description: string;
  categoryId: string | null;
  prepTimeMinutes: number | null;
  servings: number | null;
  difficulty: Difficulty | null;
  dietPreference: DietPreference | null;
  ingredients: DraftIngredient[];
  steps: DraftStep[];
  authorMessageToModerator: string | null;
  localImageUri: string | null; // pending upload, never sent via draft_upsert
  coverImageUrl: string | null; // set once uploaded
  lastSyncedAt: string | null;
  // Not part of the TechSpec's Core Interfaces, but required to implement
  // UT-018's "or null since creation" 7-day soft-warning rule, which needs a
  // creation timestamp to fall back on when lastSyncedAt has never been set.
  createdAt: string;
}

export type MyRecipeStatus = Exclude<RecipeStatus, 'removida'>;

export interface MyRecipeSummary {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  status: MyRecipeStatus;
}

export interface PaginatedMyRecipes {
  items: MyRecipeSummary[];
  nextCursor: string | null;
}

// Matches api/src/recipes/recipes.service.ts's CreateRecipePayload verbatim
// (camelCase) — the draft_upsert and POST /recipes wire contract.
export interface RecipeAuthoringPayload {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  prepTimeMinutes: number;
  servings: number;
  difficulty: Difficulty;
  dietPreference: DietPreference;
  ingredients: DraftIngredient[];
  steps: DraftStep[];
  authorMessageToModerator?: string;
  coverImageUrl?: string;
}
