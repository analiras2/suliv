import type { PaginatedResponse, PaginationParams } from "./pagination";

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
    super("Not found");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error {
  readonly status = 401 as const;
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function apiFetch<T>(
  url: string,
  options: RequestInit & { signal?: AbortSignal } = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  // In server-rendered requests, forward the auth cookie as Bearer token
  // so internal API calls keep the authenticated context.
  if (typeof window === "undefined" && !headers.has("Authorization")) {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const accessToken = cookieStore.get("suliv_access")?.value;
      if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    } catch {
      // Ignore when outside Next request context.
    }
  }

  const res = await fetch(url, {
    credentials: "include", // httpOnly cookies sent automatically
    ...options,
    headers,
  });

  if (res.status === 401) throw new UnauthorizedError();
  if (res.status === 404) throw new NotFoundError();
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function getRecipes(
  params: RecipeQueryParams = {},
  options: { signal?: AbortSignal; cache?: RequestCache; revalidate?: number } = {},
): Promise<PaginatedResponse<RecipeCard>> {
  const url = buildUrl("/api/recipes", params as Record<string, string | number | undefined>);
  return apiFetch(url, {
    signal: options.signal,
    cache: options.cache,
    ...(options.revalidate != null
      ? { next: { revalidate: options.revalidate } as RequestInit["next"] }
      : {}),
  });
}

export async function getRecipeDetail(
  idOrSlug: string,
  options: { signal?: AbortSignal; cache?: RequestCache } = {},
): Promise<{ recipe: RecipeDetail; isFavorite: boolean }> {
  const url = buildUrl(`/api/recipes/${idOrSlug}`);
  return apiFetch(url, { signal: options.signal, cache: options.cache });
}

export async function addFavorite(
  recipeId: string,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  await apiFetch(`/api/favorites/${recipeId}`, {
    method: "POST",
    signal: options.signal,
  });
}

export async function removeFavorite(
  recipeId: string,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  await apiFetch(`/api/favorites/${recipeId}`, {
    method: "DELETE",
    signal: options.signal,
  });
}

export async function getFavorites(
  params: PaginationParams,
  options: { signal?: AbortSignal } = {},
): Promise<PaginatedResponse<RecipeCard>> {
  const url = buildUrl("/api/favorites", params as unknown as Record<string, string | number | undefined>);
  return apiFetch(url, { signal: options.signal });
}
