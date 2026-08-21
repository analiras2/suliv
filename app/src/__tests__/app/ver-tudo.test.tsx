import { render } from '@testing-library/react-native';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

const mockParams: { origin: string; categoryKey?: string } = { origin: 'categoria', categoryKey: 'cafe_da_manha' };
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn<() => boolean>();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ back: mockBack, replace: mockReplace, canGoBack: mockCanGoBack }),
}));

const mockListingScreen = jest.fn((_props: unknown) => null);
jest.mock('@/screens/listing-screen', () => ({
  ListingScreen: (props: unknown) => mockListingScreen(props),
}));

// eslint-disable-next-line import/first
import VerTudoScreen from '@/app/ver-tudo';

function listingProps() {
  return mockListingScreen.mock.calls.at(-1)?.[0] as {
    origin: string;
    categoryKey?: string;
    onBack: () => void;
  };
}

describe('VerTudoScreen (ADR-003 thin route wrapper)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards the origin and categoryKey route params to ListingScreen', async () => {
    mockParams.origin = 'categoria';
    mockParams.categoryKey = 'cafe_da_manha';

    await render(<VerTudoScreen />);

    expect(listingProps()).toMatchObject({ origin: 'categoria', categoryKey: 'cafe_da_manha' });
  });

  it('forwards an undefined categoryKey for the top_semana origin', async () => {
    mockParams.origin = 'top_semana';
    mockParams.categoryKey = undefined;

    await render(<VerTudoScreen />);

    expect(listingProps()).toMatchObject({ origin: 'top_semana', categoryKey: undefined });
  });

  it('forwards the selecionadas origin', async () => {
    mockParams.origin = 'selecionadas';
    mockParams.categoryKey = undefined;

    await render(<VerTudoScreen />);

    expect(listingProps()).toMatchObject({ origin: 'selecionadas', categoryKey: undefined });
  });

  it('supplies a back handler that pops the stack when there is history behind the route', async () => {
    mockCanGoBack.mockReturnValue(true);

    await render(<VerTudoScreen />);
    listingProps().onBack();

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('falls back to the feed when the route was deep-linked with nothing behind it', async () => {
    // router.back() is a silent no-op on an empty history, which would leave the only
    // visible way out of the screen doing nothing at all.
    mockCanGoBack.mockReturnValue(false);

    await render(<VerTudoScreen />);
    listingProps().onBack();

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
