import { renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

const mockRequestMediaLibraryPermissionsAsync: jest.Mock<(...args: unknown[]) => Promise<{ granted: boolean }>> =
  jest.fn();
const mockLaunchImageLibraryAsync: jest.Mock<
  (...args: unknown[]) => Promise<{ canceled: boolean; assets: { uri: string }[] }>
> = jest.fn();
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: (...args: unknown[]) => mockRequestMediaLibraryPermissionsAsync(...args),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibraryAsync(...args),
  launchCameraAsync: jest.fn(),
}));

let mockFormState: {
  isSubmitting: boolean;
  submitError: string | null;
  setCoverImage: jest.Mock;
};
jest.mock('@/module/recipe-authoring/viewModels/use-recipe-form-view-model', () => ({
  useRecipeFormViewModel: () => mockFormState,
}));

// eslint-disable-next-line import/first
import { useRecipeFormScreenViewModel } from './use-recipe-form-screen-view-model';

describe('useRecipeFormScreenViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormState = { isSubmitting: false, submitError: null, setCoverImage: jest.fn() };
  });

  it('navigates to the list once a submit attempt finishes with no error', async () => {
    const { rerender } = await renderHook(() => useRecipeFormScreenViewModel(undefined));

    mockFormState = { ...mockFormState, isSubmitting: true };
    await rerender({});
    mockFormState = { ...mockFormState, isSubmitting: false, submitError: null };
    await rerender({});

    expect(mockReplace).toHaveBeenCalledWith('/profile/my-recipes');
  });

  it('does not navigate when a submit attempt finishes with an error', async () => {
    const { rerender } = await renderHook(() => useRecipeFormScreenViewModel(undefined));

    mockFormState = { ...mockFormState, isSubmitting: true };
    await rerender({});
    mockFormState = { ...mockFormState, isSubmitting: false, submitError: 'Falhou' };
    await rerender({});

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('pickCoverImageFromLibrary does nothing when permission is denied', async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false });
    const { result } = await renderHook(() => useRecipeFormScreenViewModel(undefined));

    await result.current.pickCoverImageFromLibrary();

    expect(mockLaunchImageLibraryAsync).not.toHaveBeenCalled();
    expect(mockFormState.setCoverImage).not.toHaveBeenCalled();
  });

  it('pickCoverImageFromLibrary sets the cover image from the picked asset', async () => {
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file://pic.jpg' }] });
    const { result } = await renderHook(() => useRecipeFormScreenViewModel(undefined));

    await result.current.pickCoverImageFromLibrary();

    expect(mockFormState.setCoverImage).toHaveBeenCalledWith('file://pic.jpg');
  });
});
