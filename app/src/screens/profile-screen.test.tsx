import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

const mockUseProfileViewModel = jest.fn();
jest.mock('@/module/profile/use-profile-view-model', () => ({
  useProfileViewModel: () => mockUseProfileViewModel(),
}));
jest.mock('@/components/atoms/icon', () => ({ Icon: () => null }));

// eslint-disable-next-line import/first
import { ProfileScreen } from './profile-screen';

describe('ProfileScreen', () => {
  it('renders a loading state while the real profile is fetched', async () => {
    mockUseProfileViewModel.mockReturnValue({
      error: null, isLoading: true, isWorking: false, name: '', settings: [],
    });
    const screen = await render(<ProfileScreen />);
    expect(screen.getByTestId('profile-loading')).toBeTruthy();
  });

  it('renders the session-backed name and settings actions', async () => {
    mockUseProfileViewModel.mockReturnValue({
      error: null,
      isLoading: false,
      isWorking: false,
      name: 'Ana Maria',
      settings: [
        { id: 'delete-account', icon: 'user', label: 'Excluir conta', tone: 'danger', testID: 'settings-delete-account' },
        { id: 'sign-out', icon: 'logOut', label: 'Sair', tone: 'danger', testID: 'settings-sign-out' },
      ],
    });
    const screen = await render(<ProfileScreen />);
    expect(screen.getByTestId('profile-greeting').props.children).toEqual(['Oi, ', 'ana maria']);
    expect(screen.getByTestId('settings-delete-account')).toBeTruthy();
    expect(screen.getByTestId('settings-sign-out')).toBeTruthy();
  });
});
