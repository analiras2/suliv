import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { AnalyticsClient } from '@/lib/analytics';
import { RecipeAuthoringServiceError, type RecipeAuthoringService } from '@/module/recipe-authoring/services/recipe-authoring-service';

// use-recipe-drafts-store hydrates from MMKV and depends on drafts-sync-service
// as a module-load side effect — those are stubbed, but the real store is used
// so field updates actually flow through and trigger re-renders (same pattern
// as use-recipe-detail-view-model.test.ts uses for use-favorites-store).
jest.mock('@/lib/offline-cache', () => ({
  offlineCache: { get: () => null, set: jest.fn(), remove: jest.fn() },
}));
jest.mock('@/module/auth/services/auth-service', () => ({
  authService: { getSession: jest.fn(async () => null) },
}));
jest.mock('@/module/recipe-authoring/services/drafts-sync-service', () => ({
  draftsSyncService: { enqueueUpsert: jest.fn(), flush: jest.fn(), onDraftSynced: jest.fn(() => jest.fn()) },
}));
const mockAttemptAutoUpload = jest.fn();
jest.mock('@/module/recipe-authoring/services/recipe-image-upload-service', () => ({
  attemptAutoUpload: (...args: unknown[]) => mockAttemptAutoUpload(...args),
}));

// eslint-disable-next-line import/first
import { useRecipeDraftsStore } from '@/module/recipe-authoring/store/use-recipe-drafts-store';
// eslint-disable-next-line import/first
import { useRecipeFormViewModel, type RecipeFormExisting } from './use-recipe-form-view-model';

function buildAuthoring(overrides: Partial<RecipeAuthoringService> = {}): RecipeAuthoringService {
  return {
    create: jest.fn(),
    update: jest.fn(async () => ({ id: 'x', slug: 'x', status: 'em_analise', coverImageUrl: null })),
    submit: jest.fn(async () => ({ id: 'x', slug: 'x', status: 'em_analise', coverImageUrl: null })),
    delete: jest.fn(),
    listMine: jest.fn(),
    ...overrides,
  } as unknown as RecipeAuthoringService;
}

describe('useRecipeFormViewModel', () => {
  let analytics: jest.Mocked<AnalyticsClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    useRecipeDraftsStore.setState({ drafts: {} });
    analytics = { track: jest.fn() };
  });

  it('UT-019: creating a new form fires submitted_recipe_started for the newly created draft', async () => {
    const { result } = await renderHook(() => useRecipeFormViewModel(undefined, analytics, buildAuthoring()));

    expect(analytics.track).toHaveBeenCalledWith('submitted_recipe_started', { recipe_id: result.current.id });
    expect(useRecipeDraftsStore.getState().drafts[result.current.id]).toBeDefined();
  });

  it('UT-009: submit() with no coverImageUrl is blocked client-side, no submit call made', async () => {
    const authoring = buildAuthoring();
    const { result } = await renderHook(() => useRecipeFormViewModel(undefined, analytics, authoring));

    await act(async () => {
      await result.current.submit();
    });

    expect(authoring.submit).not.toHaveBeenCalled();
    expect(result.current.submitError).toEqual(expect.any(String));
    expect(result.current.canSubmit).toBe(false);
  });

  // UT-019 (second half)
  it('a successful submit with a cover image fires submitted_recipe_completed', async () => {
    const authoring = buildAuthoring();
    const { result } = await renderHook(() => useRecipeFormViewModel(undefined, analytics, authoring));
    const id = result.current.id;

    await act(() => {
      useRecipeDraftsStore.getState().updateDraft(id, {
        title: 'Bolo',
        description: 'Desc',
        categoryId: 'cat-1',
        prepTimeMinutes: 30,
        servings: 4,
        difficulty: 'iniciante',
        dietPreference: 'vegano',
        ingredients: [{ name: 'Farinha', quantity: 1, unit: 'kg', scalesWithServings: true, order: 0 }],
        steps: [{ order: 0, description: 'Misture', stepTimeSeconds: null }],
      });
      useRecipeDraftsStore.getState().setCoverImageUrl(id, 'https://cdn/img.jpg');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(authoring.submit).toHaveBeenCalledWith(id);
    expect(analytics.track).toHaveBeenCalledWith('submitted_recipe_completed', { recipe_id: id });
    expect(result.current.submitError).toBeNull();
  });

  // derived from coverage matrix + Data Flow step 6: approved-edit resubmission
  it('editing an approved recipe calls update() directly and does not fire submitted_recipe_completed', async () => {
    const authoring = buildAuthoring();
    const existing: RecipeFormExisting = {
      id: 'recipe-approved-1',
      status: 'aprovada',
      coverImageUrl: 'https://cdn/existing.jpg',
      fields: {
        title: 'Receita aprovada',
        description: 'Desc',
        categoryId: 'cat-1',
        prepTimeMinutes: 20,
        servings: 2,
        difficulty: 'avancado',
        dietPreference: 'flexitariano',
        ingredients: [{ name: 'Ovo', quantity: 2, unit: 'unidade', scalesWithServings: true, order: 0 }],
        steps: [{ order: 0, description: 'Bata os ovos', stepTimeSeconds: null }],
        authorMessageToModerator: null,
      },
    };
    analytics.track.mockClear();
    const { result } = await renderHook(() => useRecipeFormViewModel(existing, analytics, authoring));

    await act(async () => {
      await result.current.submit();
    });

    expect(authoring.update).toHaveBeenCalledWith(
      'recipe-approved-1',
      expect.objectContaining({ id: 'recipe-approved-1', title: 'Receita aprovada' }),
    );
    expect(authoring.submit).not.toHaveBeenCalled();
    expect(analytics.track).not.toHaveBeenCalledWith('submitted_recipe_completed', expect.anything());
    // no new draft was created for an approved-recipe edit
    expect(useRecipeDraftsStore.getState().drafts['recipe-approved-1']).toBeUndefined();
  });

  // derived from coverage matrix (US-006.EC-1): submission rate-limit UX
  it('a 429 from submit() surfaces a rate-limited state instead of throwing', async () => {
    const authoring = buildAuthoring({
      submit: jest.fn(async () => {
        throw new RecipeAuthoringServiceError(429);
      }),
    });
    const { result } = await renderHook(() => useRecipeFormViewModel(undefined, analytics, authoring));
    const id = result.current.id;

    await act(() => {
      useRecipeDraftsStore.getState().updateDraft(id, {
        title: 'Bolo',
        description: 'Desc',
        categoryId: 'cat-1',
        prepTimeMinutes: 30,
        servings: 4,
        difficulty: 'iniciante',
        dietPreference: 'vegano',
        ingredients: [{ name: 'Farinha', quantity: 1, unit: 'kg', scalesWithServings: true, order: 0 }],
        steps: [{ order: 0, description: 'Misture', stepTimeSeconds: null }],
      });
      useRecipeDraftsStore.getState().setCoverImageUrl(id, 'https://cdn/img.jpg');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.isRateLimited).toBe(true);
    expect(result.current.submitError).toEqual(expect.any(String));
  });

  it('addIngredient/addStep append entries with the correct order', async () => {
    const { result } = await renderHook(() => useRecipeFormViewModel(undefined, analytics, buildAuthoring()));

    await act(() => {
      result.current.addIngredient();
      result.current.addIngredient();
      result.current.addStep();
    });

    expect(result.current.fields.ingredients).toHaveLength(2);
    expect(result.current.fields.ingredients[1].order).toBe(1);
    expect(result.current.fields.steps).toHaveLength(1);
  });

  it('removeIngredient re-indexes remaining entries by order', async () => {
    const { result } = await renderHook(() => useRecipeFormViewModel(undefined, analytics, buildAuthoring()));

    await act(() => {
      result.current.addIngredient();
      result.current.addIngredient();
    });
    await act(() => {
      result.current.removeIngredient(0);
    });

    expect(result.current.fields.ingredients).toHaveLength(1);
    expect(result.current.fields.ingredients[0].order).toBe(0);
  });
});
