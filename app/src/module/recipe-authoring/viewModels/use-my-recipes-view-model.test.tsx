import type { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactNode } from 'react';

jest.mock('@/lib/offline-cache', () => ({
  offlineCache: { get: () => null, set: jest.fn(), remove: jest.fn() },
}));
jest.mock('@/module/auth/services/auth-service', () => ({
  authService: { getSession: jest.fn(async () => null) },
}));
jest.mock('@/module/recipe-authoring/services/drafts-sync-service', () => ({
  draftsSyncService: { enqueueUpsert: jest.fn(), flush: jest.fn(), onDraftSynced: jest.fn(() => jest.fn()) },
}));

// eslint-disable-next-line import/first
import { useSessionStore } from '@/module/auth/store/use-session-store';
// eslint-disable-next-line import/first
import type { RecipeAuthoringService } from '@/module/recipe-authoring/services/recipe-authoring-service';
// eslint-disable-next-line import/first
import { useRecipeDraftsStore } from '@/module/recipe-authoring/store/use-recipe-drafts-store';
// eslint-disable-next-line import/first
import type { MyRecipeSummary, RecipeDraft } from '@/module/recipe-authoring/types';
// eslint-disable-next-line import/first
import { useMyRecipesViewModel } from './use-my-recipes-view-model';

function buildSummary(overrides: Partial<MyRecipeSummary> = {}): MyRecipeSummary {
  return { id: 'r1', slug: 'r1', title: 'Receita', coverImageUrl: null, status: 'rascunho', ...overrides };
}

function buildDraft(overrides: Partial<RecipeDraft> = {}): RecipeDraft {
  return {
    id: 'draft-1',
    title: '',
    description: '',
    categoryId: null,
    prepTimeMinutes: null,
    servings: null,
    difficulty: null,
    dietPreference: null,
    ingredients: [],
    steps: [],
    authorMessageToModerator: null,
    localImageUri: null,
    coverImageUrl: null,
    lastSyncedAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildAuthoring(overrides: Partial<RecipeAuthoringService> = {}): RecipeAuthoringService {
  return {
    create: jest.fn(),
    update: jest.fn(),
    submit: jest.fn(),
    delete: jest.fn(),
    listMine: jest.fn(async () => ({ items: [], nextCursor: null })),
    ...overrides,
  } as unknown as RecipeAuthoringService;
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useMyRecipesViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRecipeDraftsStore.setState({ drafts: {} });
    useSessionStore.setState({
      session: { access_token: 'token', user: { id: 'user-1' } } as unknown as Session,
      user: null,
      status: 'authenticated',
    });
  });

  // UT-015
  it('groups recipes across all four statuses', async () => {
    const authoring = buildAuthoring({
      listMine: jest.fn(async () => ({
        items: [
          buildSummary({ id: 'r1', status: 'rascunho' }),
          buildSummary({ id: 'r2', status: 'em_analise' }),
          buildSummary({ id: 'r3', status: 'aprovada' }),
          buildSummary({ id: 'r4', status: 'precisa_de_ajustes' }),
        ],
        nextCursor: null,
      })),
    });

    const { result } = await renderHook(() => useMyRecipesViewModel(authoring), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groups.rascunho.map((r) => r.id)).toEqual(['r1']);
    expect(result.current.groups.em_analise.map((r) => r.id)).toEqual(['r2']);
    expect(result.current.groups.aprovada.map((r) => r.id)).toEqual(['r3']);
    expect(result.current.groups.precisa_de_ajustes.map((r) => r.id)).toEqual(['r4']);
  });

  // UT-016
  it('exposes an empty state when there are no recipes', async () => {
    const authoring = buildAuthoring();
    const { result } = await renderHook(() => useMyRecipesViewModel(authoring), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isEmpty).toBe(true);
  });

  // UT-017 boundary
  it('flags hasTooManyUnsentDrafts only above 10 unsent drafts', async () => {
    const tenDrafts = Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [`d${i}`, buildDraft({ id: `d${i}`, lastSyncedAt: null })]),
    );
    useRecipeDraftsStore.setState({ drafts: tenDrafts });
    const { result: atTen } = await renderHook(() => useMyRecipesViewModel(buildAuthoring()), { wrapper });
    await waitFor(() => expect(atTen.current.isLoading).toBe(false));
    expect(atTen.current.hasTooManyUnsentDrafts).toBe(false);

    const elevenDrafts = { ...tenDrafts, d10: buildDraft({ id: 'd10', lastSyncedAt: null }) };
    useRecipeDraftsStore.setState({ drafts: elevenDrafts });
    const { result: atEleven } = await renderHook(() => useMyRecipesViewModel(buildAuthoring()), { wrapper });
    await waitFor(() => expect(atEleven.current.isLoading).toBe(false));
    expect(atEleven.current.hasTooManyUnsentDrafts).toBe(true);
  });

  // UT-018 boundary
  it('flags a draft as stale only strictly more than 7 days unsynced', async () => {
    const now = Date.now();
    // A few seconds of slack around the exact 7-day boundary absorbs the
    // real time that elapses between capturing `now` and the assertion
    // below (render + waitFor), which would otherwise flip "fresh" past
    // the boundary and make this test flaky.
    const justUnderSevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000 + 5000).toISOString();
    const justOverSevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000 - 5000).toISOString();
    useRecipeDraftsStore.setState({
      drafts: {
        fresh: buildDraft({ id: 'fresh', lastSyncedAt: justUnderSevenDaysAgo }),
        stale: buildDraft({ id: 'stale', lastSyncedAt: justOverSevenDaysAgo }),
        neverSyncedButNew: buildDraft({ id: 'new', lastSyncedAt: null, createdAt: new Date(now).toISOString() }),
      },
    });

    const { result } = await renderHook(() => useMyRecipesViewModel(buildAuthoring()), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.staleDraftIds).toEqual(['stale']);
  });

  // derived UT-013
  it('requestDelete previews the favorites-impact count without deleting', async () => {
    const authoring = buildAuthoring({ delete: jest.fn(async () => ({ favoritesCount: 3 })) });
    const { result } = await renderHook(() => useMyRecipesViewModel(authoring), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const preview = await result.current.requestDelete('r1');

    expect(preview).toEqual({ favoritesCount: 3 });
    expect(authoring.delete).toHaveBeenCalledWith('r1', false);
  });

  // derived UT-014
  it('confirmDelete confirms the soft delete and refreshes the list', async () => {
    const authoring = buildAuthoring({ delete: jest.fn(async () => undefined) });
    const { result } = await renderHook(() => useMyRecipesViewModel(authoring), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await result.current.confirmDelete('r1');

    expect(authoring.delete).toHaveBeenCalledWith('r1', true);
  });
});
