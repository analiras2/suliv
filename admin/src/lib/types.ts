export type RecipeStatus = 'rascunho' | 'em_analise' | 'aprovada' | 'precisa_de_ajustes' | 'removida';

export type AdjustmentReason =
  | 'ingrediente_ambiguo'
  | 'passo_confuso'
  | 'falta_foto'
  | 'foto_baixa_qualidade'
  | 'tempo_porcao_incoerente'
  | 'conteudo_inadequado'
  | 'outro';

export const ADJUSTMENT_REASON_LABELS: Record<AdjustmentReason, string> = {
  ingrediente_ambiguo: 'Ingrediente ambíguo',
  passo_confuso: 'Passo confuso/incompleto',
  falta_foto: 'Falta foto',
  foto_baixa_qualidade: 'Foto de baixa qualidade',
  tempo_porcao_incoerente: 'Tempo/porção incoerente',
  conteudo_inadequado: 'Conteúdo inadequado',
  outro: 'Outro',
};

export interface RecipeSummary {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  category: unknown;
  timeBucket: string;
  difficulty: string;
  dietPreference: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: number | null;
  unit: string;
  scalesWithServings: boolean;
}

export interface RecipeStep {
  order: number;
  description: string;
  stepTimeSeconds: number | null;
}

export interface RecipeDetail extends RecipeSummary {
  description: string;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  averageRating: number | null;
  ratingCount: number;
  status: RecipeStatus;
  authorMessageToModerator: string | null;
  adjustmentReason: AdjustmentReason | null;
  adjustmentNote: string | null;
}

export interface PaginatedRecipes {
  items: RecipeSummary[];
  nextCursor: string | null;
}

export type ReportTargetType = 'recipe' | 'comment';
export type ReportStatus = 'pending' | 'reviewed';
export type ReportReason =
  | 'conteudo_inadequado'
  | 'spam'
  | 'informacao_incorreta_perigosa'
  | 'discurso_odio_assedio'
  | 'outro';

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  freeText: string | null;
  status: ReportStatus;
  createdAt: string;
}

export interface PaginatedReports {
  items: Report[];
  nextCursor: string | null;
}

export type ResolveReportAction = 'dismiss' | 'hide_content' | 'reopen_recipe';

export type AllergenStatus = 'approved' | 'pending';

export interface Allergen {
  id: string;
  name: string;
  status: AllergenStatus;
  createdAt: string;
}

export type BoostStatus = 'upcoming' | 'active' | 'expired';

export interface Boost {
  id: string;
  recipeId: string;
  weight: number;
  startsAt: string;
  endsAt: string;
  status: BoostStatus;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage: number | null;
}
