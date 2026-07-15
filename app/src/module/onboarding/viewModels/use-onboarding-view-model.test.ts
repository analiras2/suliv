import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { AnalyticsClient } from '@/lib/analytics';
import type { OfflineCache } from '@/lib/offline-cache';
import type { OnboardingService, OnboardingSubmitPayload } from '@/module/onboarding/services/onboarding-service';
import type { ProfileSnapshot } from '@/module/splash/services/critical-data-service';

const PROFILE_SNAPSHOT_CACHE_KEY = 'cache:profile-snapshot';

jest.mock('@/module/onboarding/services/onboarding-service', () => ({ onboardingService: {} }));
jest.mock('@/lib/offline-cache', () => ({ offlineCache: {} }));
jest.mock('@/lib/analytics', () => ({ analyticsClient: {} }));
jest.mock('@/module/splash/services/critical-data-service', () => ({
  PROFILE_SNAPSHOT_CACHE_KEY: 'cache:profile-snapshot',
}));

// eslint-disable-next-line import/first
import { useOnboardingViewModel } from './use-onboarding-view-model';

const snapshot: ProfileSnapshot = {
  id: 'user-1',
  name: 'Ana',
  username: 'ana',
  avatarUrl: null,
  onboardingCompletedAt: '2026-01-01T00:00:00.000Z',
  cachedAt: '2026-01-01T00:00:00.000Z',
};

describe('useOnboardingViewModel', () => {
  let service: jest.Mocked<OnboardingService>;
  let cache: jest.Mocked<OfflineCache>;
  let analytics: jest.Mocked<AnalyticsClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = {
      fetchApprovedAllergens: jest.fn(),
      submitOnboarding: jest.fn<OnboardingService['submitOnboarding']>().mockResolvedValue(snapshot),
    };
    cache = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<OfflineCache>;
    analytics = {
      track: jest.fn(),
    } as unknown as jest.Mocked<AnalyticsClient>;
  });

  async function setup() {
    return renderHook(() => useOnboardingViewModel(service, cache, analytics));
  }

  async function fillValidState(result: { current: ReturnType<typeof useOnboardingViewModel> }) {
    await act(async () => { result.current.setDietPreference('vegano'); });
    await act(async () => { result.current.next(); });
    await act(async () => { result.current.toggleAllergen('id-1'); });
    await act(async () => { result.current.addNewTerm('quinoa em pó'); });
    await act(async () => { result.current.next(); });
    await act(async () => { result.current.setCookingLevel('iniciante'); });
    await act(async () => { result.current.setCookingFrequency('raramente'); });
  }

  it('UT-001: setDietPreference updates state and makes step 0 valid', async () => {
    const { result } = await setup();

    await act(async () => { result.current.setDietPreference('vegano'); });

    expect(result.current.dietPreference).toBe('vegano');
    expect(result.current.isStepValid).toBe(true);
    expect(analytics.track).toHaveBeenCalledWith('preference_base_selected', { diet_preference: 'vegano' });
  });

  it('UT-002: step 0 is invalid initially with no diet preference set', async () => {
    const { result } = await setup();

    expect(result.current.dietPreference).toBeNull();
    expect(result.current.isStepValid).toBe(false);
  });

  it('UT-003: toggleAllergen adds then removes an id', async () => {
    const { result } = await setup();

    await act(async () => { result.current.toggleAllergen('id-1'); });
    expect(result.current.allergenIds).toEqual(['id-1']);
    expect(analytics.track).toHaveBeenCalledWith('allergy_added', { allergen_id: 'id-1', is_new_term: false });

    await act(async () => { result.current.toggleAllergen('id-1'); });
    expect(result.current.allergenIds).toEqual([]);
  });

  it('UT-004: addNewTerm appends the term and fires allergy_added with is_new_term true', async () => {
    const { result } = await setup();

    await act(async () => { result.current.addNewTerm('quinoa em pó'); });

    expect(result.current.newTerms).toEqual(['quinoa em pó']);
    expect(analytics.track).toHaveBeenCalledWith('allergy_added', { allergen_id: null, is_new_term: true });
  });

  it('UT-005: step 1 is valid even with empty allergenIds and newTerms', async () => {
    const { result } = await setup();

    await act(async () => { result.current.setDietPreference('vegano'); });
    await act(async () => { result.current.next(); });

    expect(result.current.step).toBe(1);
    expect(result.current.allergenIds).toEqual([]);
    expect(result.current.newTerms).toEqual([]);
    expect(result.current.isStepValid).toBe(true);
  });

  it('UT-006: step 2 becomes valid only after both cookingLevel and cookingFrequency are set', async () => {
    const { result } = await setup();
    await act(async () => { result.current.setDietPreference('vegano'); });
    await act(async () => { result.current.next(); });
    await act(async () => { result.current.next(); });

    await act(async () => { result.current.setCookingLevel('iniciante'); });
    expect(result.current.isStepValid).toBe(false);

    await act(async () => { result.current.setCookingFrequency('raramente'); });
    expect(result.current.isStepValid).toBe(true);
  });

  it('UT-007: step 2 is invalid when only cookingLevel is set', async () => {
    const { result } = await setup();
    await act(async () => { result.current.setDietPreference('vegano'); });
    await act(async () => { result.current.next(); });
    await act(async () => { result.current.next(); });

    await act(async () => { result.current.setCookingLevel('iniciante'); });

    expect(result.current.cookingFrequency).toBeNull();
    expect(result.current.isStepValid).toBe(false);
  });

  it('UT-008: next() on a valid step advances and fires onboarding_step_completed', async () => {
    const { result } = await setup();
    await act(async () => { result.current.setDietPreference('vegano'); });

    await act(async () => { result.current.next(); });

    expect(result.current.step).toBe(1);
    expect(analytics.track).toHaveBeenCalledWith('onboarding_step_completed', {
      step: 'estilo',
      step_index: 0,
    });
  });

  it('UT-009: next() on an invalid step is a no-op and fires no event', async () => {
    const { result } = await setup();

    await act(async () => { result.current.next(); });

    expect(result.current.step).toBe(0);
    expect(analytics.track).not.toHaveBeenCalledWith('onboarding_step_completed', expect.anything());
  });

  it('UT-010: back() preserves previously entered state', async () => {
    const { result } = await setup();
    await act(async () => { result.current.setDietPreference('vegano'); });
    await act(async () => { result.current.next(); });
    await act(async () => { result.current.toggleAllergen('id-1'); });

    await act(async () => { result.current.back(); });

    expect(result.current.step).toBe(0);
    expect(result.current.dietPreference).toBe('vegano');
    expect(result.current.allergenIds).toEqual(['id-1']);
  });

  it('UT-011: submit() calls submitOnboarding with a payload matching accumulated state', async () => {
    const { result } = await setup();
    await fillValidState(result);

    await act(async () => {
      await result.current.submit();
    });

    const expectedPayload: OnboardingSubmitPayload = {
      dietPreference: 'vegano',
      allergenIds: ['id-1'],
      newTerms: ['quinoa em pó'],
      cookingLevel: 'iniciante',
      cookingFrequency: 'raramente',
    };
    expect(service.submitOnboarding).toHaveBeenCalledWith(expectedPayload);
  });

  it('UT-012: submit() success writes offline-cache and fires onboarding_completed', async () => {
    const { result } = await setup();
    await fillValidState(result);

    await act(async () => {
      await result.current.submit();
    });

    expect(cache.set).toHaveBeenCalledWith(PROFILE_SNAPSHOT_CACHE_KEY, snapshot);
    expect(analytics.track).toHaveBeenCalledWith('onboarding_completed', {
      diet_preference: 'vegano',
      cooking_level: 'iniciante',
      cooking_frequency: 'raramente',
      allergy_count: 2,
    });
    expect(result.current.submitStatus).toBe('idle');
  });

  it('UT-013: submit() failure sets submitStatus to error, preserves state, and does not call offline-cache', async () => {
    service.submitOnboarding.mockRejectedValue(new Error('network down'));
    const { result } = await setup();
    await fillValidState(result);

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.submitStatus).toBe('error');
    expect(result.current.dietPreference).toBe('vegano');
    expect(result.current.allergenIds).toEqual(['id-1']);
    expect(result.current.newTerms).toEqual(['quinoa em pó']);
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('UT-014: retrying submit() after a failure sends an identical payload with no duplicated entries', async () => {
    service.submitOnboarding.mockRejectedValueOnce(new Error('network down'));
    const { result } = await setup();
    await fillValidState(result);

    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.submitStatus).toBe('error');

    service.submitOnboarding.mockResolvedValueOnce(snapshot);
    await act(async () => {
      await result.current.submit();
    });

    expect(service.submitOnboarding).toHaveBeenCalledTimes(2);
    const [firstCall, secondCall] = service.submitOnboarding.mock.calls.map(([callPayload]) => callPayload);
    expect(firstCall).toEqual(secondCall);
    expect(secondCall.allergenIds).toEqual(['id-1']);
    expect(secondCall.newTerms).toEqual(['quinoa em pó']);
  });
});
