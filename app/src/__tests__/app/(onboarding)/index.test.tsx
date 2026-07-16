import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

// eslint-disable-next-line import/first
import OnboardingWelcomeScreen from '@/app/(onboarding)/index';

describe('OnboardingWelcomeScreen (UT-001, UT-002)', () => {
  it('UT-001: renders the eyebrow, headline with italicized emphasis, body copy, and the numbered 3-item step list', async () => {
    const rendered = await render(<OnboardingWelcomeScreen />);

    expect(rendered.getByText(/bem-vindo à suliv/i)).toBeTruthy();
    expect(rendered.getByText('jeito')).toBeTruthy();
    expect(rendered.getByText(/entender suas preferências/i)).toBeTruthy();
    expect(rendered.getByText('Preferência alimentar')).toBeTruthy();
    expect(rendered.getByText('Alergias e restrições')).toBeTruthy();
    expect(rendered.getByText('Tempo e experiência na cozinha')).toBeTruthy();
  });

  it('UT-002: pressing "Começar" calls router.push with the wizard route', async () => {
    const rendered = await render(<OnboardingWelcomeScreen />);

    fireEvent.press(rendered.getByTestId('onboarding-welcome-start-button'));

    expect(mockPush).toHaveBeenCalledWith('/steps');
  });
});
