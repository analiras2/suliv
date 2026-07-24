import type { Difficulty, DietPreference, RecipeCategoryKey, TimeBucket } from '@/module/recipes/types';
import type { RecipeSummary } from '@/module/feed/types';

export type ListingOrigin = 'selecionadas' | 'categoria' | 'top_semana' | 'busca';

export interface ListingFilters {
  q?: string;
  category?: string;
  time?: TimeBucket;
  difficulty?: Difficulty;
  diet?: DietPreference;
  allergens?: string[];
}

export interface RecipeSearchResult extends RecipeSummary {
  conflictsWithUser: boolean;
}

export interface PaginatedRecipes {
  items: RecipeSearchResult[];
  nextCursor: string | null;
}

export const CATEGORY_LABELS: Record<RecipeCategoryKey, string> = {
  cafe_da_manha: 'Café da manhã',
  almoco_jantar: 'Almoço/Jantar',
  lanche: 'Lanche',
  sobremesa: 'Sobremesa',
  bebida: 'Bebida',
  molhos_acompanhamentos: 'Molhos/Acompanhamentos',
};
