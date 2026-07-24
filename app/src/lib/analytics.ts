export interface AnalyticsEventPayloads {
  onboarding_started: Record<string, never>;
  onboarding_step_completed: { step: 'estilo' | 'alergias' | 'nivel_frequencia'; step_index: number };
  preference_base_selected: { diet_preference: string };
  allergy_added: { allergen_id: string | null; is_new_term: boolean };
  onboarding_completed: {
    diet_preference: string;
    cooking_level: string;
    cooking_frequency: string;
    allergy_count: number;
  };
  recipe_opened: { recipe_id: string; origin: string };
  feed_viewed: Record<string, never>;
  feed_section_viewed: { section: 'selecionadas' | 'categorias' | 'top_semana'; category_key?: string };
  search_used: { query_length: number; has_filters: boolean };
  filter_applied: {
    filter_type: 'categoria' | 'tempo' | 'dificuldade' | 'preferencia' | 'alergia';
    filter_value: string;
  };
  serving_adjusted: { recipe_id: string; from_servings: number; to_servings: number };
  recipe_warning_viewed: { recipe_id: string; allergen_id: string };
  favorite_saved: { recipe_id: string; offline: boolean };
  favorite_removed: { recipe_id: string };
  favorite_saved_offline: { recipe_id: string; idempotency_key: string };
  favorites_viewed: { count: number };
  submitted_recipe_started: { recipe_id: string };
  submitted_recipe_completed: { recipe_id: string };
}

export interface AnalyticsClient {
  track<TEvent extends keyof AnalyticsEventPayloads>(
    event: TEvent,
    properties: AnalyticsEventPayloads[TEvent],
  ): void;
}

export const analyticsClient: AnalyticsClient = {
  track(event, properties) {
    console.info(`[analytics] ${event}`, properties);
  },
};
