import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

import type { RecipeDetailViewModel } from '@/module/recipes/viewModels/use-recipe-detail-view-model';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/module/recipes/viewModels/use-recipe-detail-view-model', () => ({
  useRecipeDetailViewModel: jest.fn(),
}));
jest.mock('@/components/organisms/recipe-detail-content', () => ({ RecipeDetailContent: () => null }));

// eslint-disable-next-line import/first
import { useRecipeDetailViewModel } from '@/module/recipes/viewModels/use-recipe-detail-view-model';
// eslint-disable-next-line import/first
import { RecipeDetailScreen } from '@/screens/recipe-detail-screen';

const mockedUseRecipeDetailViewModel = jest.mocked(useRecipeDetailViewModel);

function buildViewModel(overrides: Partial<RecipeDetailViewModel> = {}): RecipeDetailViewModel {
  return {
    recipe: undefined,
    isLoading: false,
    notFound: false,
    servings: 0,
    setServings: jest.fn(),
    scaledIngredients: [],
    averageRating: null,
    ratingCount: 0,
    isSaved: false,
    toggleSave: jest.fn(),
    startCooking: jest.fn(),
    goBack: jest.fn(),
    refetch: jest.fn(),
    ...overrides,
  };
}

describe('RecipeDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the recipe_not_found StateView, not a blank screen, on a 404', async () => {
    mockedUseRecipeDetailViewModel.mockReturnValue(buildViewModel({ notFound: true }));

    const rendered = await render(<RecipeDetailScreen recipeId="does-not-exist" />);

    expect(rendered.getByTestId('state-view-recipe_not_found')).toBeTruthy();
  });

  it('navigates back to the feed when the not-found primary action is pressed', async () => {
    mockedUseRecipeDetailViewModel.mockReturnValue(buildViewModel({ notFound: true }));

    const rendered = await render(<RecipeDetailScreen recipeId="does-not-exist" />);
    fireEvent.press(rendered.getByTestId('state-view-primary-action'));

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('renders nothing while loading, not the not-found state', async () => {
    mockedUseRecipeDetailViewModel.mockReturnValue(buildViewModel({ isLoading: true, notFound: false }));

    const rendered = await render(<RecipeDetailScreen recipeId="some-slug" />);

    expect(rendered.queryByTestId('state-view-recipe_not_found')).toBeNull();
  });
});
