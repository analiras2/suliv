import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { StateView } from '@/components/molecules/state-view';

describe('StateView', () => {
  it('renders title, description, and primaryAction, and calls onPress when tapped', async () => {
    const onPress = jest.fn();

    const rendered = await render(
      <StateView
        illustrationIcon="warning"
        title="Sem conexão"
        description="Verifique sua conexão e tente novamente."
        primaryAction={{ label: 'Tentar novamente', onPress }}
      />,
    );

    expect(rendered.getByText('Sem conexão')).toBeTruthy();
    expect(rendered.getByText('Verifique sua conexão e tente novamente.')).toBeTruthy();

    fireEvent.press(rendered.getByText('Tentar novamente'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders no secondary button when secondaryAction is not provided', async () => {
    const rendered = await render(
      <StateView
        illustrationIcon="search"
        title="Nenhum resultado"
        description="Tente outra busca."
        primaryAction={{ label: 'Limpar filtros', onPress: jest.fn() }}
      />,
    );

    expect(rendered.queryByTestId('state-view-primary-action')).toBeTruthy();
    expect(rendered.queryByTestId('state-view-secondary-action')).toBeNull();
  });
});
