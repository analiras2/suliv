import { fireEvent, render } from '@testing-library/react-native';
import { act } from 'react-test-renderer';
import { describe, expect, it, jest } from '@jest/globals';

import { OnboardingLevelFrequencyStep } from './onboarding-level-frequency-step';

describe('OnboardingLevelFrequencyStep', () => {
  it('renders both independent option groups and calls the matching setter on press', async () => {
    const onSelectLevel = jest.fn();
    const onSelectFrequency = jest.fn();
    const rendered = await render(
      <OnboardingLevelFrequencyStep
        cookingLevel={null}
        cookingFrequency={null}
        onSelectLevel={onSelectLevel}
        onSelectFrequency={onSelectFrequency}
      />,
    );

    expect(rendered.getByTestId('onboarding-level-option-iniciante')).toBeTruthy();
    expect(rendered.getByTestId('onboarding-level-option-intermediario')).toBeTruthy();
    expect(rendered.getByTestId('onboarding-level-option-avancado')).toBeTruthy();
    expect(rendered.getByTestId('onboarding-frequency-option-raramente')).toBeTruthy();
    expect(rendered.getByTestId('onboarding-frequency-option-algumas_vezes_semana')).toBeTruthy();
    expect(rendered.getByTestId('onboarding-frequency-option-quase_todo_dia')).toBeTruthy();

    await act(async () => {
      fireEvent.press(rendered.getByTestId('onboarding-level-option-avancado'));
    });
    expect(onSelectLevel).toHaveBeenCalledWith('avancado');
    expect(onSelectFrequency).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(rendered.getByTestId('onboarding-frequency-option-quase_todo_dia'));
    });
    expect(onSelectFrequency).toHaveBeenCalledWith('quase_todo_dia');
  });

  it('reflects the current cookingLevel and cookingFrequency selections independently', async () => {
    const rendered = await render(
      <OnboardingLevelFrequencyStep
        cookingLevel="intermediario"
        cookingFrequency="raramente"
        onSelectLevel={jest.fn()}
        onSelectFrequency={jest.fn()}
      />,
    );

    expect(rendered.getByTestId('onboarding-level-option-intermediario').props.accessibilityState.selected).toBe(
      true,
    );
    expect(rendered.getByTestId('onboarding-frequency-option-raramente').props.accessibilityState.selected).toBe(
      true,
    );
    expect(rendered.getByTestId('onboarding-frequency-option-quase_todo_dia').props.accessibilityState.selected).toBe(
      false,
    );
  });
});
