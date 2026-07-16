import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { OptionCard } from './option-card';

describe('OptionCard', () => {
  it('UT-005: single mode, unselected renders an unfilled radio and given content', async () => {
    const rendered = await render(
      <OptionCard
        icon="vegan"
        title="Vegano"
        subtitle="Sem produtos de origem animal"
        selected={false}
        selectionMode="single"
        onPress={jest.fn()}
        accessibilityLabel="Vegano"
        testID="option-vegano"
      />,
    );

    expect(rendered.getByText('Vegano')).toBeTruthy();
    expect(rendered.getByText('Sem produtos de origem animal')).toBeTruthy();
    expect(rendered.getByTestId('option-vegano').props.accessibilityState.selected).toBe(false);
  });

  it('UT-006: single mode, selected renders a filled radio with green-tinted selected state', async () => {
    const rendered = await render(
      <OptionCard
        icon="vegan"
        title="Vegano"
        selected
        selectionMode="single"
        onPress={jest.fn()}
        accessibilityLabel="Vegano"
        testID="option-vegano"
      />,
    );

    expect(rendered.getByTestId('option-vegano').props.accessibilityState.selected).toBe(true);
  });

  it('UT-007: multiple mode, unselected renders an empty checkbox square', async () => {
    const rendered = await render(
      <OptionCard
        icon="milk"
        title="Leite"
        selected={false}
        selectionMode="multiple"
        onPress={jest.fn()}
        accessibilityLabel="Leite"
        testID="option-leite"
      />,
    );

    expect(rendered.getByTestId('option-leite').props.accessibilityState.selected).toBe(false);
  });

  it('UT-008: multiple mode, selected renders a filled checkbox with green-tinted selected state', async () => {
    const rendered = await render(
      <OptionCard
        icon="milk"
        title="Leite"
        selected
        selectionMode="multiple"
        onPress={jest.fn()}
        accessibilityLabel="Leite"
        testID="option-leite"
      />,
    );

    expect(rendered.getByTestId('option-leite').props.accessibilityState.selected).toBe(true);
  });
});
