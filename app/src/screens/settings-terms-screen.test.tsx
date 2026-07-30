import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import type { ReactElement } from 'react';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('@/components/atoms/icon', () => ({ Icon: () => null }));
jest.mock('@/module/profile/services/terms-service', () => ({
  termsService: { getCurrentTerms: jest.fn() },
}));

// eslint-disable-next-line import/first
import { termsService } from '@/module/profile/services/terms-service';
// eslint-disable-next-line import/first
import { SettingsTermsScreen } from './settings-terms-screen';

async function renderWithClient(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('SettingsTermsScreen', () => {
  it('UT-011: fetches GET /terms/current and renders version and url', async () => {
    jest.mocked(termsService.getCurrentTerms).mockResolvedValue({
      version: '1.2.0',
      url: 'https://suliv.app/termos',
    });

    const screen = await renderWithClient(<SettingsTermsScreen />);

    await waitFor(() => expect(screen.getByTestId('settings-terms-version')).toBeTruthy());
    expect(screen.getByTestId('settings-terms-version').props.children).toEqual(['Versão ', '1.2.0']);
    expect(screen.getByTestId('settings-terms-url').props.children).toBe('https://suliv.app/termos');
  });
});
