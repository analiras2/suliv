import { fireEvent, render } from '@testing-library/react-native';
import { act } from 'react-test-renderer';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/module/auth/view-models/use-complete-profile-view-model', () => ({ useCompleteProfileViewModel: jest.fn() }));

// eslint-disable-next-line import/first
import { useCompleteProfileViewModel } from '@/module/auth/view-models/use-complete-profile-view-model';
// eslint-disable-next-line import/first
import CompleteProfileScreen from '@/app/(auth)/complete-profile';

const mockUseCompleteProfileViewModel = useCompleteProfileViewModel as jest.Mock;

function mockViewModel(overrides: Record<string, unknown> = {}) {
  mockUseCompleteProfileViewModel.mockReturnValue({
    error: null,
    name: '',
    setName: jest.fn(),
    status: 'idle',
    submitName: jest.fn(),
    ...overrides,
  });
}

describe('CompleteProfileScreen (UT-001, UT-002, UT-003, UT-004)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('UT-001: renders an enabled name input and submit button in the idle state', async () => {
    mockViewModel();
    const rendered = await render(<CompleteProfileScreen />);

    expect(rendered.getByTestId('complete-profile-name-input').props.editable).toBe(true);
    expect(rendered.getByTestId('complete-profile-submit-button').props.accessibilityState.disabled).toBe(false);
    expect(rendered.getByText('Continuar')).toBeTruthy();
  });

  it('UT-002: forwards typed text and submit taps to the view model', async () => {
    const setName = jest.fn();
    const submitName = jest.fn();
    mockViewModel({ setName, submitName });
    const rendered = await render(<CompleteProfileScreen />);

    await act(async () => {
      fireEvent.changeText(rendered.getByTestId('complete-profile-name-input'), 'Ana');
    });
    await act(async () => {
      fireEvent.press(rendered.getByTestId('complete-profile-submit-button'));
    });

    expect(setName).toHaveBeenCalledWith('Ana');
    expect(submitName).toHaveBeenCalledTimes(1);
  });

  it('UT-003: disables the input and button and shows a spinner while submitting', async () => {
    mockViewModel({ status: 'submitting' });
    const rendered = await render(<CompleteProfileScreen />);

    expect(rendered.getByTestId('complete-profile-name-input').props.editable).toBe(false);
    expect(rendered.getByTestId('complete-profile-submit-button').props.accessibilityState.disabled).toBe(true);
    expect(rendered.queryByText('Continuar')).toBeNull();
  });

  it('UT-004: shows the error message returned by the view model', async () => {
    mockViewModel({ error: 'Unable to update your profile.' });
    const rendered = await render(<CompleteProfileScreen />);

    expect(rendered.getByText('Unable to update your profile.')).toBeTruthy();
  });
});
