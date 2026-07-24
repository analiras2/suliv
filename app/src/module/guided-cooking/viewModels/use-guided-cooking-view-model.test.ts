import { act, renderHook } from '@testing-library/react-native';
import { Share } from 'react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { GuidedContentResult } from '@/module/guided-cooking/services/guided-cooking-content-service';
import { useGuidedCookingStore } from '@/module/guided-cooking/store/use-guided-cooking-store';
import type { RecipeDetail } from '@/module/recipes/types';

jest.mock('@/lib/network-status', () => ({ useNetworkStatus: () => ({ isConnected: true }) }));
// The real default deps transitively import auth-service, which eagerly constructs a Supabase
// client requiring env vars not set in this test environment. Every test here injects its own
// deps, so the defaults only need to exist as importable stubs.
jest.mock('@/module/guided-cooking/services/guided-cooking-content-service', () => ({
  guidedCookingContentService: { load: jest.fn() },
}));
jest.mock('@/module/recipes/services/comments-service', () => ({
  commentsService: { list: jest.fn(), upsert: jest.fn(), remove: jest.fn() },
}));
jest.mock('@/module/guided-cooking/services/guided-cooking-timer-service', () => ({
  guidedCookingTimerService: { schedule: jest.fn(), cancel: jest.fn(), hasElapsed: jest.fn() },
}));
jest.mock('@/module/guided-cooking/services/guided-cooking-analytics-service', () => ({
  guidedCookingAnalyticsService: { track: jest.fn(), flush: jest.fn() },
}));
const mockGetCachedRecipeDetail = jest.fn();
jest.mock('@/module/recipes/services/recipe-detail-cache', () => ({
  getCachedRecipeDetail: (slug: string) => mockGetCachedRecipeDetail(slug),
}));
jest.mock('@/module/recipes/store/use-favorites-store', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { create } = require('zustand');
  const store = create(
    (
      set: (partial: object) => void,
      get: () => { favorites: Record<string, { recipeId: string; slug: string; favoritedAt: string }> },
    ) => ({
      favorites: {},
      toggleFavorite: (recipe: RecipeDetail) => {
        const { favorites } = get();
        const next = { ...favorites };
        if (next[recipe.id]) {
          delete next[recipe.id];
        } else {
          next[recipe.id] = { recipeId: recipe.id, slug: recipe.slug, favoritedAt: new Date().toISOString() };
        }
        set({ favorites: next });
      },
    }),
  );
  return { useFavoritesStore: store };
});

// eslint-disable-next-line import/first
import {
  useGuidedCookingViewModel,
  type GuidedCookingViewModelDeps,
} from './use-guided-cooking-view-model';
// eslint-disable-next-line import/first
import { useFavoritesStore } from '@/module/recipes/store/use-favorites-store';

const steps = [
  { order: 1, description: 'Misture os ingredientes', stepTimeSeconds: 90 },
  { order: 2, description: 'Sirva', stepTimeSeconds: null },
];

const detail: RecipeDetail = {
  id: 'recipe-1',
  slug: 'bolo-de-cenoura',
  title: 'Bolo de cenoura',
  coverImageUrl: null,
  category: { id: 'cat-1', key: 'sobremesa', label: 'Sobremesa' },
  timeBucket: 'trinta_60',
  difficulty: 'iniciante',
  dietPreference: 'vegetariano',
  description: 'Bolo simples',
  servings: 8,
  ingredients: [],
  steps,
  averageRating: null,
  ratingCount: 0,
};

function buildDeps(overrides: Partial<GuidedCookingViewModelDeps> = {}): GuidedCookingViewModelDeps {
  return {
    contentService: {
      load: jest.fn<() => Promise<GuidedContentResult>>().mockResolvedValue({ kind: 'online', detail }),
    },
    timerService: {
      schedule: jest.fn(async (stepIndex: number, durationSeconds: number) => ({
        stepIndex,
        durationSeconds,
        endsAt: Date.now() + durationSeconds * 1000,
        notificationId: 'notification-1',
      })),
      cancel: jest.fn(async () => undefined),
      hasElapsed: jest.fn(() => false),
    },
    analyticsService: {
      track: jest.fn(),
      flush: jest.fn(async () => undefined),
    },
    commentsService: {
      list: jest.fn(),
      upsert: jest.fn(async () => undefined),
      remove: jest.fn(),
    },
    ...overrides,
  } as GuidedCookingViewModelDeps;
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function setup(deps = buildDeps()) {
  const rendered = await renderHook(() => useGuidedCookingViewModel('bolo-de-cenoura', deps));
  await flush();
  return { ...rendered, deps };
}

describe('useGuidedCookingViewModel', () => {
  beforeEach(() => {
    useGuidedCookingStore.getState().reset();
    useFavoritesStore.setState({ favorites: {} });
    mockGetCachedRecipeDetail.mockReset();
    mockGetCachedRecipeDetail.mockReturnValue({ ...detail, cachedAt: '2026-07-23T00:00:00.000Z' });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes the session and fires guided_cook_started on successful content load', async () => {
    const { result, deps } = await setup();

    expect(result.current.phase).toBe('cooking');
    expect(result.current.steps).toEqual(steps);
    expect(deps.analyticsService.track).toHaveBeenCalledWith(
      { type: 'guided_cook_started', recipeId: 'recipe-1' },
      true,
    );
  });

  // UT-002, UT-003
  it('startTimer sets activeTimer and fires guided_timer_started; a timer already active is not replaced', async () => {
    const { result, deps } = await setup();

    await act(async () => {
      result.current.startTimer(0);
    });
    await flush();

    expect(result.current.activeTimer).toEqual(
      expect.objectContaining({ stepIndex: 0, durationSeconds: 90 }),
    );
    expect(deps.analyticsService.track).toHaveBeenCalledWith(
      { type: 'guided_timer_started', recipeId: 'recipe-1', stepIndex: 0, durationSeconds: 90 },
      true,
    );

    await act(async () => {
      result.current.startTimer(1);
    });
    await flush();

    expect(result.current.activeTimer).toEqual(expect.objectContaining({ stepIndex: 0 }));
    expect(deps.timerService.schedule).toHaveBeenCalledTimes(1);
  });

  // UT-004
  it('requestAdvance with no active timer advances immediately and fires had_timer:false', async () => {
    const { result, deps } = await setup();

    await act(async () => {
      result.current.requestAdvance();
    });

    expect(result.current.currentStepIndex).toBe(1);
    expect(deps.analyticsService.track).toHaveBeenCalledWith(
      { type: 'guided_step_completed', recipeId: 'recipe-1', stepIndex: 0, hadTimer: false },
      true,
    );
  });

  // UT-005
  it('requestAdvance with an active timer sets confirmingAdvance and does not advance', async () => {
    const { result } = await setup();

    await act(async () => {
      result.current.startTimer(0);
    });
    await flush();

    await act(async () => {
      result.current.requestAdvance();
    });

    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.confirmingAdvance).toBe(true);
  });

  // UT-006, UT-007
  it('confirmAdvance cancels the notification, fires both events, then advances', async () => {
    const { result, deps } = await setup();

    await act(async () => {
      result.current.startTimer(0);
    });
    await flush();

    await act(async () => {
      result.current.requestAdvance();
    });

    await act(async () => {
      result.current.confirmAdvance();
    });
    await flush();

    expect(deps.timerService.cancel).toHaveBeenCalledWith('notification-1');
    expect(result.current.activeTimer).toBeNull();
    expect(deps.analyticsService.track).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'guided_timer_abandoned', recipeId: 'recipe-1', stepIndex: 0 }),
      true,
    );
    expect(deps.analyticsService.track).toHaveBeenCalledWith(
      { type: 'guided_step_completed', recipeId: 'recipe-1', stepIndex: 0, hadTimer: true },
      true,
    );
    expect(result.current.currentStepIndex).toBe(1);
    expect(result.current.confirmingAdvance).toBe(false);
  });

  // UT-008
  it('cancelAdvanceRequest leaves activeTimer and currentStepIndex unchanged', async () => {
    const { result } = await setup();

    await act(async () => {
      result.current.startTimer(0);
    });
    await flush();

    await act(async () => {
      result.current.requestAdvance();
    });

    await act(async () => {
      result.current.cancelAdvanceRequest();
    });

    expect(result.current.confirmingAdvance).toBe(false);
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.activeTimer).toEqual(expect.objectContaining({ stepIndex: 0 }));
  });

  // UT-009, UT-010
  it('elapsed timer clears activeTimer and fires guided_timer_completed without auto-advancing', async () => {
    jest.useFakeTimers({ legacyFakeTimers: false });
    const deps = buildDeps();
    (deps.timerService.hasElapsed as jest.Mock).mockReturnValue(false);
    const { result } = await renderHook(() => useGuidedCookingViewModel('bolo-de-cenoura', deps));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      result.current.startTimer(0);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    (deps.timerService.hasElapsed as jest.Mock).mockReturnValue(true);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.activeTimer).toBeNull();
    expect(deps.analyticsService.track).toHaveBeenCalledWith(
      { type: 'guided_timer_completed', recipeId: 'recipe-1', stepIndex: 0 },
      true,
    );

    await act(async () => {
      result.current.requestAdvance();
    });

    expect(result.current.currentStepIndex).toBe(1);
    expect(deps.analyticsService.track).toHaveBeenCalledWith(
      { type: 'guided_step_completed', recipeId: 'recipe-1', stepIndex: 0, hadTimer: false },
      true,
    );
  });

  // UT-013
  it('requestAdvance on the last step transitions to finished and fires guided_cook_finished', async () => {
    const { result, deps } = await setup();

    await act(async () => {
      result.current.requestAdvance();
    });
    expect(result.current.currentStepIndex).toBe(1);

    await act(async () => {
      result.current.requestAdvance();
    });

    expect(result.current.phase).toBe('finished');
    expect(deps.analyticsService.track).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'guided_cook_finished', recipeId: 'recipe-1' }),
      true,
    );
  });

  // UT-014
  it('fires guided_cook_abandoned exactly once on unmount while cooking, not when finished', async () => {
    const { result, deps, unmount } = await setup();
    void result;

    await unmount();

    const abandonCalls = (deps.analyticsService.track as jest.Mock).mock.calls.filter(
      (call) => (call[0] as { type: string }).type === 'guided_cook_abandoned',
    );
    expect(abandonCalls).toEqual([[{ type: 'guided_cook_abandoned', recipeId: 'recipe-1', lastStepIndex: 0 }, true]]);
  });

  it('does not fire guided_cook_abandoned on unmount while finished', async () => {
    const { result, deps, unmount } = await setup();

    await act(async () => {
      result.current.requestAdvance();
    });
    await act(async () => {
      result.current.requestAdvance();
    });
    expect(result.current.phase).toBe('finished');

    await unmount();

    const abandonCalls = (deps.analyticsService.track as jest.Mock).mock.calls.filter(
      (call) => (call[0] as { type: string }).type === 'guided_cook_abandoned',
    );
    expect(abandonCalls).toHaveLength(0);
  });

  // UT-015
  it('rate(4) calls the rating service with the current recipeId', async () => {
    const { result, deps } = await setup();

    await act(async () => {
      result.current.rate(4);
    });

    expect(deps.commentsService.upsert).toHaveBeenCalledWith('recipe-1', { rating: 4 });
  });

  // UT-016: same as above, from the assigned test contract — CommentsService.upsert replaces the
  // removed PUT /recipes/:recipeId/rating endpoint; phase/activeTimer are unaffected by the call.
  it('rate(4) invokes CommentsService.upsert and leaves phase/activeTimer unchanged', async () => {
    const { result, deps } = await setup();

    await act(async () => {
      result.current.rate(4);
    });

    expect(deps.commentsService.upsert).toHaveBeenCalledWith('recipe-1', { rating: 4 });
    expect(result.current.phase).toBe('cooking');
    expect(result.current.activeTimer).toBeNull();
  });

  // UT-017
  it('share() invokes the OS share API with the public slug link and makes no network request', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    const fetchSpy = jest.spyOn(global, 'fetch');
    const { result } = await setup();
    fetchSpy.mockClear();

    await act(async () => {
      result.current.share();
    });

    expect(shareSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'https://suliv.app/r/bolo-de-cenoura',
        url: 'https://suliv.app/r/bolo-de-cenoura',
      }),
    );
    expect(fetchSpy).not.toHaveBeenCalled();

    shareSpy.mockRestore();
  });

  it('toggleFavorite favorites the currently-cooked recipe via the cached detail, and isFavorited reflects it', async () => {
    const { result } = await setup();

    expect(result.current.isFavorited).toBe(false);

    await act(async () => {
      result.current.toggleFavorite();
    });

    expect(mockGetCachedRecipeDetail).toHaveBeenCalledWith('bolo-de-cenoura');
    expect(useFavoritesStore.getState().favorites['recipe-1']).toBeDefined();
    expect(result.current.isFavorited).toBe(true);
  });

  it('toggleFavorite unfavorites an already-favorited recipe', async () => {
    const { result } = await setup();

    await act(async () => {
      result.current.toggleFavorite();
    });
    expect(result.current.isFavorited).toBe(true);

    await act(async () => {
      result.current.toggleFavorite();
    });

    expect(result.current.isFavorited).toBe(false);
    expect(useFavoritesStore.getState().favorites['recipe-1']).toBeUndefined();
  });
});
