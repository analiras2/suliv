import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { AnalyticsClient } from '@/lib/analytics';
import type { FeedResponse } from '@/module/feed/types';

const mockPush = jest.fn();
const mockToggleSaved = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/module/feed/queries/use-feed-query', () => ({ useFeedQuery: jest.fn() }));
jest.mock('@/module/recipes/viewModels/use-favorite-toggle', () => ({
  useFavoriteToggle: jest.fn(() => ({ savedIds: new Set(['r1']), toggleSaved: mockToggleSaved })),
}));

// eslint-disable-next-line import/first
import { useFeedQuery } from '@/module/feed/queries/use-feed-query';
// eslint-disable-next-line import/first
import { useFavoriteToggle } from '@/module/recipes/viewModels/use-favorite-toggle';
// eslint-disable-next-line import/first
import { useFeedViewModel } from './use-feed-view-model';

const mockedUseFeedQuery = jest.mocked(useFeedQuery);
const mockedUseFavoriteToggle = jest.mocked(useFavoriteToggle);

function buildRecipe(id: string): FeedResponse['selectedForYou'][number] {
  return {
    id,
    slug: id,
    title: `Recipe ${id}`,
    coverImageUrl: null,
    category: { id: 'cat-1', key: 'cafe_da_manha', label: 'Café' },
    timeBucket: 'ate_15',
    difficulty: 'iniciante',
    dietPreference: 'vegano',
  };
}

const feedResponse: FeedResponse = {
  selectedForYou: [buildRecipe('r1'), buildRecipe('r2')],
  categories: [
    { category: { id: 'cat-1', key: 'cafe_da_manha', label: 'Café' }, recipes: [buildRecipe('r3')] },
  ],
  topOfWeek: [buildRecipe('r4')],
};

describe('useFeedViewModel', () => {
  let analytics: jest.Mocked<AnalyticsClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseFavoriteToggle.mockReturnValue({ savedIds: new Set(['r1']), toggleSaved: mockToggleSaved });
    analytics = { track: jest.fn() };
    mockedUseFeedQuery.mockReturnValue({ isLoading: false, data: feedResponse } as ReturnType<typeof useFeedQuery>);
  });

  async function setup() {
    return renderHook(() => useFeedViewModel(analytics));
  }

  it('UT-007: derives selectedForYou, categorySections, and topOfWeek from a raw GET /feed response with no data loss', async () => {
    const { result } = await setup();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.selectedForYou).toEqual(feedResponse.selectedForYou);
    expect(result.current.categorySections).toEqual(feedResponse.categories);
    expect(result.current.topOfWeek).toEqual(feedResponse.topOfWeek);
  });

  it('UT-008: openRecipe fires recipe_opened with the correct payload and navigates', async () => {
    const { result } = await setup();

    await act(() => {
      result.current.openRecipe('recipe-1', 'feed_selecionadas');
    });

    expect(analytics.track).toHaveBeenCalledWith('recipe_opened', {
      recipe_id: 'recipe-1',
      origin: 'feed_selecionadas',
    });
    expect(mockPush).toHaveBeenCalledWith('/recipe/recipe-1');
  });

  it('UT-009: openVerTudo navigates with the correct { origin, categoryKey } params', async () => {
    const { result } = await setup();

    await act(() => {
      result.current.openVerTudo('categoria', 'cafe_da_manha');
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/ver-tudo',
      params: { origin: 'categoria', categoryKey: 'cafe_da_manha' },
    });
  });

  it('UT-010: savedIds/toggleSaved delegate to useFavoriteToggle, given the flattened recipe list', async () => {
    const { result } = await setup();

    expect(result.current.savedIds).toEqual(new Set(['r1']));

    await act(() => {
      result.current.toggleSaved('recipe-1');
    });

    expect(mockToggleSaved).toHaveBeenCalledWith('recipe-1');
    expect(mockedUseFavoriteToggle).toHaveBeenCalledWith([
      ...feedResponse.selectedForYou,
      ...feedResponse.categories.flatMap((section) => section.recipes),
      ...feedResponse.topOfWeek,
    ]);
  });
});
