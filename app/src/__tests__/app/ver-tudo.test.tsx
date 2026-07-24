import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

const mockParams: { origin: string; categoryKey?: string } = { origin: 'categoria', categoryKey: 'cafe_da_manha' };
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams }));

const mockListingScreen = jest.fn((_props: unknown) => null);
jest.mock('@/screens/listing-screen', () => ({
  ListingScreen: (props: unknown) => mockListingScreen(props),
}));

// eslint-disable-next-line import/first
import VerTudoScreen from '@/app/ver-tudo';

describe('VerTudoScreen (ADR-003 thin route wrapper)', () => {
  it('forwards the origin and categoryKey route params to ListingScreen', async () => {
    await render(<VerTudoScreen />);

    expect(mockListingScreen).toHaveBeenCalledWith({ origin: 'categoria', categoryKey: 'cafe_da_manha' });
  });

  it('forwards an undefined categoryKey for the top_semana origin', async () => {
    mockParams.origin = 'top_semana';
    mockParams.categoryKey = undefined;

    await render(<VerTudoScreen />);

    expect(mockListingScreen).toHaveBeenCalledWith({ origin: 'top_semana', categoryKey: undefined });
  });

  it('forwards the selecionadas origin', async () => {
    mockParams.origin = 'selecionadas';
    mockParams.categoryKey = undefined;

    await render(<VerTudoScreen />);

    expect(mockListingScreen).toHaveBeenCalledWith({ origin: 'selecionadas', categoryKey: undefined });
  });
});
