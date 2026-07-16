import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

const mockParams: { origin: string; categoryKey?: string } = { origin: 'categoria', categoryKey: 'cafe_da_manha' };
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams }));

// eslint-disable-next-line import/first
import VerTudoScreen from '@/app/ver-tudo';

describe('VerTudoScreen (ADR-003 placeholder route)', () => {
  it('renders a title reflecting the origin and the category key when present', async () => {
    const rendered = await render(<VerTudoScreen />);

    expect(rendered.getByTestId('ver-tudo-title')).toBeTruthy();
    expect(rendered.getByTestId('ver-tudo-category-key').props.children).toBe('cafe_da_manha');
  });

  it('renders without a category key for the top_semana origin', async () => {
    mockParams.origin = 'top_semana';
    mockParams.categoryKey = undefined;

    const rendered = await render(<VerTudoScreen />);

    expect(rendered.getByText('Top da semana')).toBeTruthy();
    expect(rendered.queryByTestId('ver-tudo-category-key')).toBeNull();
  });
});
