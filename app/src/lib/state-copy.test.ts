import { describe, expect, it } from '@jest/globals';

import { STATE_COPY, type AppStateKey } from '@/lib/state-copy';

const ALL_STATE_KEYS: AppStateKey[] = [
  'splash_offline',
  'login_offline_no_session',
  'search_no_results',
  'feed_no_relevant_recipes',
  'favorites_empty',
  'my_recipes_empty',
  'submit_error',
  'recipe_not_found',
  'onboarding_submit_error',
];

describe('STATE_COPY', () => {
  it('has a non-empty title, description, and primaryActionLabel for every AppStateKey', () => {
    for (const key of ALL_STATE_KEYS) {
      const entry = STATE_COPY[key];

      expect(entry).toBeDefined();
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
      expect(entry.primaryActionLabel.length).toBeGreaterThan(0);
    }
  });
});
