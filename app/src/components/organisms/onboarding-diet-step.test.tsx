import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { OnboardingDietStep } from './onboarding-diet-step';

describe('OnboardingDietStep', () => {
  it('renders the 3 fixed diet options and calls onSelect on press', async () => {
    const onSelect = jest.fn();
    const rendered = await render(<OnboardingDietStep dietPreference={null} onSelect={onSelect} />);

    expect(rendered.getByTestId('onboarding-diet-option-vegano')).toBeTruthy();
    expect(rendered.getByTestId('onboarding-diet-option-vegetariano')).toBeTruthy();
    expect(rendered.getByTestId('onboarding-diet-option-flexitariano')).toBeTruthy();

    fireEvent.press(rendered.getByTestId('onboarding-diet-option-vegano'));
    expect(onSelect).toHaveBeenCalledWith('vegano');
  });

  it('reflects the current dietPreference selection as controlled state', async () => {
    const rendered = await render(<OnboardingDietStep dietPreference="vegetariano" onSelect={jest.fn()} />);

    expect(rendered.getByTestId('onboarding-diet-option-vegetariano').props.accessibilityState.selected).toBe(true);
    expect(rendered.getByTestId('onboarding-diet-option-vegano').props.accessibilityState.selected).toBe(false);
  });
});
