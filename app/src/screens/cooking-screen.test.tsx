import { fireEvent, render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { GuidedCookingViewModel } from '@/module/guided-cooking/viewModels/use-guided-cooking-view-model';
import { useGuidedCookingStore } from '@/module/guided-cooking/store/use-guided-cooking-store';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('@/module/guided-cooking/viewModels/use-guided-cooking-view-model', () => ({
  useGuidedCookingViewModel: jest.fn(),
}));

// eslint-disable-next-line import/first
import { useGuidedCookingViewModel } from '@/module/guided-cooking/viewModels/use-guided-cooking-view-model';
// eslint-disable-next-line import/first
import { CookingScreen } from './cooking-screen';

const mockedUseGuidedCookingViewModel = jest.mocked(useGuidedCookingViewModel);

function buildViewModel(overrides: Partial<GuidedCookingViewModel> = {}): GuidedCookingViewModel {
  return {
    phase: 'finished',
    steps: [],
    currentStepIndex: 0,
    activeTimer: null,
    confirmingAdvance: false,
    isFavorited: false,
    startTimer: jest.fn(),
    requestAdvance: jest.fn(),
    confirmAdvance: jest.fn(),
    cancelAdvanceRequest: jest.fn(),
    rate: jest.fn(),
    share: jest.fn(),
    toggleFavorite: jest.fn(),
    ...overrides,
  };
}

describe('CookingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useGuidedCookingStore.getState().reset();
  });

  // UT-016
  it('finalization favoritar delegates to the view model toggleFavorite', async () => {
    useGuidedCookingStore.setState({ recipeId: 'recipe-1' });
    const toggleFavorite = jest.fn();
    mockedUseGuidedCookingViewModel.mockReturnValue(buildViewModel({ toggleFavorite }));

    const rendered = await render(<CookingScreen slug="bolo-de-cenoura" />);

    fireEvent.press(rendered.getByTestId('finalization-favorite-button'));

    expect(toggleFavorite).toHaveBeenCalledTimes(1);
  });

  it('reflects the current saved state on the favoritar button', async () => {
    useGuidedCookingStore.setState({ recipeId: 'recipe-1' });
    mockedUseGuidedCookingViewModel.mockReturnValue(buildViewModel({ isFavorited: true }));

    const rendered = await render(<CookingScreen slug="bolo-de-cenoura" />);

    expect(rendered.getByTestId('finalization-panel')).toBeTruthy();
    expect(rendered.getByText('Favoritado')).toBeTruthy();
  });
});
