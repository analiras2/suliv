import { fetchWithAuth, handleResponse, NetworkError } from "./authApi";
import type { PaginatedResponse } from "../types/pagination";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface RecipeCard {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  prepTimeMin: number;
  cookTimeMin: number;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  servings: number;
  isFavorite: boolean;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  optional: boolean;
  isAllergen: boolean;
}

export interface RecipeStep {
  id: string;
  order: number;
  instruction: string;
  timerSeconds: number | null;
}

export interface NutritionInfo {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export interface RecipeDetail extends RecipeCard {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutritionPerServing: NutritionInfo | null;
}

export interface RecipeQueryParams {
  q?: string;
  category?: string;
  difficulty?: Difficulty;
  maxTime?: number;
  mainIngredient?: string;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class NotFoundError extends Error {
  readonly status = 404 as const;
  constructor() {
    super("Recipe not found");
    this.name = "NotFoundError";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

async function handleRecipeResponse<T>(res: Response): Promise<T> {
  if (res.status === 404) throw new NotFoundError();
  return handleResponse<T>(res);
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function getRecipes(
  params: RecipeQueryParams = {},
): Promise<PaginatedResponse<RecipeCard>> {
  const qs = buildQueryString(params as Record<string, string | number | undefined>);
  const res = await fetchWithAuth(`/api/recipes${qs}`, { method: "GET" });
  return handleRecipeResponse(res);
}

export async function getRecipeDetail(
  id: string,
): Promise<{ recipe: RecipeDetail; isFavorite: boolean }> {
  const res = await fetchWithAuth(`/api/recipes/${id}`, { method: "GET" });
  return handleRecipeResponse(res);
}

export async function addFavorite(recipeId: string): Promise<void> {
  let res: Response;
  try {
    res = await fetchWithAuth(`/api/favorites/${recipeId}`, { method: "POST" });
  } catch {
    throw new NetworkError(`Failed to add favorite: ${recipeId}`);
  }
  await handleRecipeResponse<unknown>(res);
}

export async function removeFavorite(recipeId: string): Promise<void> {
  let res: Response;
  try {
    res = await fetchWithAuth(`/api/favorites/${recipeId}`, { method: "DELETE" });
  } catch {
    throw new NetworkError(`Failed to remove favorite: ${recipeId}`);
  }
  if (res.status !== 204) await handleRecipeResponse<unknown>(res);
}
