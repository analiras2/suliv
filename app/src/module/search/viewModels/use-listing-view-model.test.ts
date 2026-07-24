import { act, renderHook } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { AnalyticsClient } from '@/lib/analytics';
import type { RecipeSearchResult } from '@/module/search/types';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/module/search/queries/use-search-query', () => ({ useSearchQuery: jest.fn() }));
jest.mock('@/module/recipes/viewModels/use-favorite-toggle', () => ({
  useFavoriteToggle: jest.fn(() => ({ savedIds: new Set(), toggleSaved: jest.fn() })),
}));

// eslint-disable-next-line import/first
import { useSearchQuery } from '@/module/search/queries/use-search-query';
// eslint-disable-next-line import/first
import { useListingViewModel, type UseListingViewModelParams } from './use-listing-view-model';

const mockedUseSearchQuery = jest.mocked(useSearchQuery);

function lastCallFilters() {
  const call = mockedUseSearchQuery.mock.calls.at(-1);
  return call?.[1];
}

function buildResult(id: string): RecipeSearchResult {
  return {
    id,
    slug: id,
    title: `Recipe ${id}`,
    coverImageUrl: null,
    category: { id: 'cat-1', key: 'lanche', label: 'Lanche' },
    timeBucket: 'ate_15',
    difficulty: 'iniciante',
    dietPreference: 'vegano',
    conflictsWithUser: false,
  };
}

describe('useListingViewModel', () => {
  let analytics: jest.Mocked<AnalyticsClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    analytics = { track: jest.fn() };
    mockedUseSearchQuery.mockReturnValue({
      data: { pages: [] },
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    } as unknown as ReturnType<typeof useSearchQuery>);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function setup(params: UseListingViewModelParams = {}) {
    return renderHook(() => useListingViewModel(params, analytics));
  }

  it("UT-009: title reflects the category's label for origin: 'categoria'", async () => {
    const { result } = await setup({ origin: 'categoria', categoryKey: 'cafe_da_manha' });

    expect(result.current.title).toBe('Café da manhã');
  });

  it('UT-010: query input debounces before triggering search_used and the underlying network call', async () => {
    const { result } = await setup();

    await act(() => {
      result.current.setQuery('a');
      result.current.setQuery('ab');
      result.current.setQuery('abc');
    });

    expect(lastCallFilters()?.q).toBeUndefined();
    expect(analytics.track).not.toHaveBeenCalledWith('search_used', expect.anything());

    await act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(lastCallFilters()?.q).toBe('abc');
    expect(analytics.track).toHaveBeenCalledWith('search_used', { query_length: 3, has_filters: false });
    expect(analytics.track).toHaveBeenCalledTimes(1);
  });

  it('UT-011: setting category and diet filters together includes both in the request params', async () => {
    const { result } = await setup();

    await act(() => {
      result.current.setFilter('category', 'lanche');
    });
    await act(() => {
      result.current.setFilter('diet', 'vegano');
    });

    expect(lastCallFilters()).toEqual(expect.objectContaining({ category: 'lanche', diet: 'vegano' }));
    expect(analytics.track).toHaveBeenCalledWith('filter_applied', { filter_type: 'categoria', filter_value: 'lanche' });
    expect(analytics.track).toHaveBeenCalledWith('filter_applied', { filter_type: 'preferencia', filter_value: 'vegano' });
  });

  it('UT-012: loadMore appends the next page without duplicating already-loaded items', async () => {
    const fetchNextPage = jest.fn();
    const page1 = { items: [buildResult('r1'), buildResult('r2')], nextCursor: 'cursor-1' };
    const page2 = { items: [buildResult('r2'), buildResult('r3')], nextCursor: null };

    mockedUseSearchQuery.mockReturnValue({
      data: { pages: [page1] },
      isLoading: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    } as unknown as ReturnType<typeof useSearchQuery>);

    const { result, rerender } = await setup();

    expect(result.current.results.map((item) => item.id)).toEqual(['r1', 'r2']);

    await act(() => {
      result.current.loadMore();
    });
    expect(fetchNextPage).toHaveBeenCalledTimes(1);

    mockedUseSearchQuery.mockReturnValue({
      data: { pages: [page1, page2] },
      isLoading: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage,
    } as unknown as ReturnType<typeof useSearchQuery>);
    await act(() => {
      rerender({});
    });

    expect(result.current.results.map((item) => item.id)).toEqual(['r1', 'r2', 'r3']);
  });
});
