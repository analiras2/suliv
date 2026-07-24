import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

import type { RecipeSearchResult } from '@/module/search/types';

jest.mock('@/module/search/viewModels/use-listing-view-model', () => ({ useListingViewModel: jest.fn() }));
jest.mock('@/module/onboarding/queries/use-approved-allergens-query', () => ({
  useApprovedAllergensQuery: jest.fn(),
}));

// eslint-disable-next-line import/first
import { useListingViewModel, type ListingViewModel } from '@/module/search/viewModels/use-listing-view-model';
// eslint-disable-next-line import/first
import { useApprovedAllergensQuery } from '@/module/onboarding/queries/use-approved-allergens-query';
// eslint-disable-next-line import/first
import { ListingScreen } from '@/screens/listing-screen';

const mockedUseListingViewModel = jest.mocked(useListingViewModel);
const mockedUseApprovedAllergensQuery = jest.mocked(useApprovedAllergensQuery);

function buildResult(id: string, conflictsWithUser = false): RecipeSearchResult {
  return {
    id,
    slug: id,
    title: `Recipe ${id}`,
    coverImageUrl: null,
    category: { id: 'cat-1', key: 'lanche', label: 'Lanche' },
    timeBucket: 'ate_15',
    difficulty: 'iniciante',
    dietPreference: 'vegano',
    conflictsWithUser,
  };
}

function buildViewModel(overrides: Partial<ListingViewModel> = {}): ListingViewModel {
  return {
    title: 'Busca',
    query: '',
    setQuery: jest.fn(),
    filters: {},
    setFilter: jest.fn(),
    results: [],
    isLoading: false,
    isEmpty: false,
    hasMore: false,
    loadMore: jest.fn(),
    openRecipe: jest.fn(),
    savedIds: new Set(),
    toggleSaved: jest.fn(),
    ...overrides,
  };
}

describe('ListingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseApprovedAllergensQuery.mockReturnValue({ data: [] } as unknown as ReturnType<
      typeof useApprovedAllergensQuery
    >);
  });

  it('renders the origin-derived title and results, and shows compatible-first, conflict-flagged recipes without hiding them', async () => {
    mockedUseListingViewModel.mockReturnValue(
      buildViewModel({ title: 'Top da semana', results: [buildResult('r1'), buildResult('r2', true)] }),
    );

    const rendered = await render(<ListingScreen origin="top_semana" />);

    expect(rendered.getByTestId('ver-tudo-title').props.children).toBe('Top da semana');
    expect(rendered.getByTestId('listing-result-card-0')).toBeTruthy();
    expect(rendered.getByTestId('recipe-card-conflict-badge-r2')).toBeTruthy();
  });

  it('calls loadMore when the grid reaches the end', async () => {
    const loadMore = jest.fn();
    mockedUseListingViewModel.mockReturnValue(buildViewModel({ results: [buildResult('r1')], loadMore }));

    const rendered = await render(<ListingScreen origin="busca" />);
    fireEvent(rendered.getByTestId('recipe-grid-list'), 'endReached');

    expect(loadMore).toHaveBeenCalled();
  });

  it('shows the empty state, not a blank screen, when a search yields no results', async () => {
    mockedUseListingViewModel.mockReturnValue(buildViewModel({ isEmpty: true, results: [] }));

    const rendered = await render(<ListingScreen origin="busca" />);

    expect(rendered.getByTestId('listing-empty-state')).toBeTruthy();
  });

  it('shows a loading indicator instead of the empty state while the first page is loading', async () => {
    mockedUseListingViewModel.mockReturnValue(buildViewModel({ isLoading: true, isEmpty: false, results: [] }));

    const rendered = await render(<ListingScreen origin="busca" />);

    expect(rendered.getByTestId('listing-loading')).toBeTruthy();
    expect(rendered.queryByTestId('listing-empty-state')).toBeNull();
  });
});
