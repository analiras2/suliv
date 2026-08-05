export interface SpoonacularIngredient {
  name: string;
  amount: number;
  unit: string;
}

export interface SpoonacularInstructionStep {
  number: number;
  step: string;
}

export interface SpoonacularAnalyzedInstruction {
  steps: SpoonacularInstructionStep[];
}

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image?: string;
  readyInMinutes: number;
  servings: number;
  summary?: string;
  dishTypes: string[];
  extendedIngredients: SpoonacularIngredient[];
  analyzedInstructions: SpoonacularAnalyzedInstruction[];
  // Present when the search was made with addRecipeNutrition=true. Shape is
  // provider-defined and intentionally left unparsed — nothing reads it yet.
  nutrition?: unknown;
}

export interface SpoonacularComplexSearchResponse {
  results: SpoonacularRecipe[];
}
