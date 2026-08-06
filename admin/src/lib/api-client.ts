import type {
  Allergen,
  AllergenIngredientTerm,
  Boost,
  FeatureFlag,
  PaginatedRecipes,
  PaginatedReports,
  RecipeDetail,
  ResolveReportAction,
} from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin${path}`, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message ?? `Request failed with status ${response.status}`, response.status);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export function fetchRecipes(status?: string, cursor?: string): Promise<PaginatedRecipes> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (cursor) params.set('cursor', cursor);
  const query = params.toString();
  return request<PaginatedRecipes>(`/recipes${query ? `?${query}` : ''}`);
}

export function fetchRecipeDetail(id: string): Promise<RecipeDetail> {
  return request<RecipeDetail>(`/recipes/${id}`);
}

export function approveRecipe(id: string): Promise<void> {
  return request<void>(`/recipes/${id}/approve`, { method: 'POST' });
}

export function requestRecipeAdjustment(id: string, reason: string, note?: string): Promise<void> {
  return request<void>(`/recipes/${id}/request-adjustment`, {
    method: 'POST',
    body: JSON.stringify({ reason, note: note || undefined }),
  });
}

export function fetchReports(status?: string, cursor?: string): Promise<PaginatedReports> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (cursor) params.set('cursor', cursor);
  const query = params.toString();
  return request<PaginatedReports>(`/reports${query ? `?${query}` : ''}`);
}

export function resolveReport(id: string, action: ResolveReportAction): Promise<void> {
  return request<void>(`/reports/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export function fetchAllergens(): Promise<Allergen[]> {
  return request<Allergen[]>('/allergens?status=pending');
}

export function approveAllergen(id: string): Promise<void> {
  return request<void>(`/allergens/${id}/approve`, { method: 'POST' });
}

export function rejectAllergen(id: string): Promise<void> {
  return request<void>(`/allergens/${id}`, { method: 'DELETE' });
}

export function fetchApprovedAllergens(): Promise<Allergen[]> {
  return request<Allergen[]>('/allergens?status=approved');
}

export function createAllergenTerm(allergenId: string, term: string): Promise<AllergenIngredientTerm> {
  return request<AllergenIngredientTerm>(`/allergens/${allergenId}/ingredient-terms`, {
    method: 'POST',
    body: JSON.stringify({ term }),
  });
}

export function updateAllergenTerm(
  allergenId: string,
  termId: string,
  term: string,
): Promise<AllergenIngredientTerm> {
  return request<AllergenIngredientTerm>(`/allergens/${allergenId}/ingredient-terms/${termId}`, {
    method: 'PATCH',
    body: JSON.stringify({ term }),
  });
}

export function deleteAllergenTerm(allergenId: string, termId: string): Promise<void> {
  return request<void>(`/allergens/${allergenId}/ingredient-terms/${termId}`, { method: 'DELETE' });
}

export function fetchBoosts(): Promise<Boost[]> {
  return request<Boost[]>('/boosts');
}

export interface CreateBoostInput {
  recipe_id: string;
  weight: number;
  starts_at: string;
  ends_at: string;
}

export function createBoost(input: CreateBoostInput): Promise<Boost> {
  return request<Boost>('/boosts', { method: 'POST', body: JSON.stringify(input) });
}

export function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  return request<FeatureFlag[]>('/feature-flags');
}

export interface UpdateFeatureFlagInput {
  enabled?: boolean;
  rollout_percentage?: number;
}

export function updateFeatureFlag(key: string, changes: UpdateFeatureFlagInput): Promise<FeatureFlag> {
  return request<FeatureFlag>(`/feature-flags/${key}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}
