import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { ApprovedAllergen, OnboardingService } from '@/module/onboarding/services/onboarding-service';
import type { ProfileSnapshot } from '@/module/splash/services/critical-data-service';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

jest.mock('@/module/onboarding/services/onboarding-service', () => ({ onboardingService: {} }));
jest.mock('@/lib/offline-cache', () => ({ offlineCache: {} }));
jest.mock('@/lib/analytics', () => ({ analyticsClient: { track: jest.fn() } }));
jest.mock('@/module/splash/services/critical-data-service', () => ({
  PROFILE_SNAPSHOT_CACHE_KEY: 'cache:profile-snapshot',
}));

// eslint-disable-next-line import/first
import { analyticsClient } from '@/lib/analytics';
// eslint-disable-next-line import/first
import { offlineCache } from '@/lib/offline-cache';
// eslint-disable-next-line import/first
import { onboardingService } from '@/module/onboarding/services/onboarding-service';
// eslint-disable-next-line import/first
import OnboardingScreen from '@/app/(onboarding)/index';

const mockedService = onboardingService as jest.Mocked<OnboardingService>;
const mockedCache = offlineCache as { set: jest.Mock };
const mockedAnalytics = analyticsClient as { track: jest.Mock };

const approvedAllergens: ApprovedAllergen[] = [{ id: 'id-1', name: 'Leite' }];

const snapshot: ProfileSnapshot = {
  id: 'user-1',
  name: 'Ana',
  username: 'ana',
  avatarUrl: null,
  onboardingCompletedAt: '2026-01-01T00:00:00.000Z',
  cachedAt: '2026-01-01T00:00:00.000Z',
};

async function renderScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingScreen />
    </QueryClientProvider>,
  );
}

async function completeStepsZeroAndOne(rendered: Awaited<ReturnType<typeof renderScreen>>) {
  await act(async () => {
    fireEvent.press(rendered.getByTestId('onboarding-diet-option-vegano'));
  });
  await act(async () => {
    fireEvent.press(rendered.getByTestId('onboarding-continue-button'));
  });

  await waitFor(() => expect(rendered.getByTestId('onboarding-allergy-option-id-1')).toBeTruthy());
  await act(async () => {
    fireEvent.press(rendered.getByTestId('onboarding-allergy-option-id-1'));
  });
  await act(async () => {
    fireEvent.changeText(rendered.getByTestId('onboarding-allergy-search-input'), 'quinoa em pó');
  });
  await act(async () => {
    fireEvent.press(rendered.getByTestId('onboarding-allergy-add-new-term'));
  });
  await act(async () => {
    fireEvent.press(rendered.getByTestId('onboarding-continue-button'));
  });
}

async function completeFullFlow(rendered: Awaited<ReturnType<typeof renderScreen>>) {
  await completeStepsZeroAndOne(rendered);

  await act(async () => {
    fireEvent.press(rendered.getByTestId('onboarding-level-option-iniciante'));
  });
  await act(async () => {
    fireEvent.press(rendered.getByTestId('onboarding-frequency-option-raramente'));
  });
  await act(async () => {
    fireEvent.press(rendered.getByTestId('onboarding-submit-button'));
  });
}

describe('OnboardingScreen full-flow submit (IT-004, IT-005, IT-006)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedService.fetchApprovedAllergens = jest
      .fn<() => Promise<ApprovedAllergen[]>>()
      .mockResolvedValue(approvedAllergens);
    mockedService.submitOnboarding = jest
      .fn<OnboardingService['submitOnboarding']>()
      .mockResolvedValue(snapshot);
    mockedCache.set = jest.fn();
  });

  it('fires onboarding_started once on mount', async () => {
    await renderScreen();
    expect(mockedAnalytics.track).toHaveBeenCalledWith('onboarding_started', {});
  });

  it('IT-004: fires exactly one POST-equivalent submitOnboarding call with the combined payload', async () => {
    const rendered = await renderScreen();

    await completeFullFlow(rendered);

    await waitFor(() => expect(mockedService.submitOnboarding).toHaveBeenCalledTimes(1));
    expect(mockedService.submitOnboarding).toHaveBeenCalledWith({
      dietPreference: 'vegano',
      allergenIds: ['id-1'],
      newTerms: ['quinoa em pó'],
      cookingLevel: 'iniciante',
      cookingFrequency: 'raramente',
    });
  });

  it('IT-005: writes a ProfileSnapshot with onboardingCompletedAt non-null to offline-cache and navigates to tabs', async () => {
    const rendered = await renderScreen();

    await completeFullFlow(rendered);

    await waitFor(() => expect(mockedCache.set).toHaveBeenCalledWith('cache:profile-snapshot', snapshot));
    expect(snapshot.onboardingCompletedAt).not.toBeNull();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
  });

  it('IT-006: a rejected submit keeps the user on the final step with an inline error and retry, no offline-cache call', async () => {
    mockedService.submitOnboarding.mockRejectedValueOnce(new Error('network down'));
    const rendered = await renderScreen();

    await completeFullFlow(rendered);

    expect(rendered.getByTestId('onboarding-error-message')).toBeTruthy();
    expect(rendered.getByTestId('onboarding-retry-button')).toBeTruthy();
    expect(rendered.getByTestId('onboarding-submit-button')).toBeTruthy();
    expect(mockedCache.set).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    mockedService.submitOnboarding.mockResolvedValueOnce(snapshot);
    await act(async () => {
      fireEvent.press(rendered.getByTestId('onboarding-retry-button'));
    });

    expect(mockedService.submitOnboarding).toHaveBeenCalledTimes(2);
    const [firstCall, secondCall] = mockedService.submitOnboarding.mock.calls.map(([payload]) => payload);
    expect(firstCall).toEqual(secondCall);
    await waitFor(() => expect(mockedCache.set).toHaveBeenCalledWith('cache:profile-snapshot', snapshot));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
  });
});
