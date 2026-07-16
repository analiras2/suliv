import type { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/module/auth/services/auth-service', () => ({ authService: {} }));
jest.mock('@/module/splash/context/offline-mode-context', () => ({ useOfflineMode: () => false }));

// eslint-disable-next-line import/first
import { authService } from '@/module/auth/services/auth-service';
// eslint-disable-next-line import/first
import { useSavedRecipesStore } from '@/module/recipes/store/use-saved-recipes-store';
// eslint-disable-next-line import/first
import { HomeScreen } from './home-screen';

const session = { access_token: 'access-token' } as Session;

function buildRecipe(id: string, title: string, categoryKey: 'cafe_da_manha' | 'lanche') {
  return {
    id,
    slug: id,
    title,
    coverImageUrl: null,
    category: { id: `cat-${categoryKey}`, key: categoryKey, label: categoryKey === 'cafe_da_manha' ? 'Café da manhã' : 'Lanche' },
    timeBucket: 'ate_15',
    difficulty: 'iniciante',
    dietPreference: 'vegano',
  };
}

const feedResponse = {
  selectedForYou: [buildRecipe('r1', 'Panqueca de banana', 'cafe_da_manha')],
  categories: [
    {
      category: { id: 'cat-cafe_da_manha', key: 'cafe_da_manha', label: 'Café da manhã' },
      recipes: [buildRecipe('r2', 'Omelete de espinafre', 'cafe_da_manha')],
    },
  ],
  topOfWeek: [buildRecipe('r3', 'Wrap de grão-de-bico', 'lanche')],
};

async function renderHomeScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <HomeScreen />
    </QueryClientProvider>,
  );
}

describe('HomeScreen (IT-005, IT-006)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSavedRecipesStore.setState({ savedIds: new Set() });
    (authService as { getSession: jest.Mock }).getSession = jest
      .fn<() => Promise<Session | null>>()
      .mockResolvedValue(session);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(feedResponse),
    }) as unknown as typeof fetch;
  });

  it('IT-005: renders all 3 section headers and recipe cards matching a mocked GET /feed response', async () => {
    const screen = await renderHomeScreen();

    await waitFor(() => expect(screen.getByText('Selecionadas para você')).toBeTruthy());
    expect(screen.getByText('Categorias')).toBeTruthy();
    expect(screen.getByText('Top da semana')).toBeTruthy();

    expect(screen.getByText('Panqueca de banana')).toBeTruthy();
    expect(screen.getByText('Omelete de espinafre')).toBeTruthy();
    expect(screen.getByText('Wrap de grão-de-bico')).toBeTruthy();
  });

  it('IT-006: tapping Ver tudo on categories navigates with { origin: categoria, categoryKey }', async () => {
    const screen = await renderHomeScreen();

    await waitFor(() => expect(screen.getByTestId('categories-ver-tudo-button')).toBeTruthy());
    fireEvent.press(screen.getByTestId('categories-ver-tudo-button'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/ver-tudo',
      params: { origin: 'categoria', categoryKey: 'cafe_da_manha' },
    });
  });
});
