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
