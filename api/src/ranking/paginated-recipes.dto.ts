import { RecipeSummaryDto } from '../recipes/recipe-summary.dto';

// Shared with the Search feature's SearchService (task_02 of
// busca-filtros-ver-tudo), which reuses this shape for every listing origin.
export interface RecipeSearchResult extends RecipeSummaryDto {
  conflictsWithUser: boolean;
}

export interface PaginatedRecipes {
  items: RecipeSearchResult[];
  nextCursor: string | null;
}
