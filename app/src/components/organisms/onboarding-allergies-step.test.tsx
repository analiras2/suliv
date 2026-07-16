import type { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/module/auth/services/auth-service', () => ({ authService: {} }));
jest.mock('@/lib/offline-cache', () => ({ offlineCache: {} }));
jest.mock('@/lib/analytics', () => ({ analyticsClient: { track: jest.fn() } }));

// eslint-disable-next-line import/first
import { authService } from '@/module/auth/services/auth-service';
// eslint-disable-next-line import/first
import type { OfflineCache } from '@/lib/offline-cache';
// eslint-disable-next-line import/first
import type { OnboardingService } from '@/module/onboarding/services/onboarding-service';
// eslint-disable-next-line import/first
import { useOnboardingViewModel } from '@/module/onboarding/viewModels/use-onboarding-view-model';
// eslint-disable-next-line import/first
import { OnboardingAllergiesStep } from './onboarding-allergies-step';

const session = { access_token: 'access-token' } as Session;

const approvedAllergens = [
  { id: 'id-1', name: 'Leite' },
  { id: 'id-2', name: 'Ovos' },
  { id: 'id-3', name: 'Amendoim' },
  { id: 'id-4', name: 'Soja' },
  { id: 'id-5', name: 'Glúten' },
  { id: 'id-6', name: 'Camarão' },
  { id: 'id-7', name: 'Nozes' },
];

async function renderStep(props?: Partial<React.ComponentProps<typeof OnboardingAllergiesStep>>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onToggleAllergen = jest.fn();
  const onAddNewTerm = jest.fn();
  const onClearAllergies = jest.fn();
  const rendered = await render(
    <QueryClientProvider client={queryClient}>
      <OnboardingAllergiesStep
        allergenIds={[]}
        newTerms={[]}
        onToggleAllergen={onToggleAllergen}
        onAddNewTerm={onAddNewTerm}
        onClearAllergies={onClearAllergies}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { ...rendered, onToggleAllergen, onAddNewTerm, onClearAllergies };
}

describe('OnboardingAllergiesStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService as { getSession: jest.Mock }).getSession = jest
      .fn<() => Promise<Session | null>>()
      .mockResolvedValue(session);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => approvedAllergens,
    }) as unknown as typeof fetch;
  });

  it('IT-001: renders all 7 approved allergens fetched via fetchApprovedAllergens', async () => {
    const rendered = await renderStep();

    for (const allergen of approvedAllergens) {
      await waitFor(() => expect(rendered.getByTestId(`onboarding-allergy-option-${allergen.id}`)).toBeTruthy());
    }
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('IT-002: filters the rendered list as the user types with no additional network request', async () => {
    const rendered = await renderStep();
    await waitFor(() => expect(rendered.getByTestId('onboarding-allergy-option-id-1')).toBeTruthy());

    await act(async () => {
      fireEvent.changeText(rendered.getByTestId('onboarding-allergy-search-input'), 'leit');
    });

    expect(rendered.getByTestId('onboarding-allergy-option-id-1')).toBeTruthy();
    expect(rendered.queryByTestId('onboarding-allergy-option-id-2')).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('IT-003: adding a new free-text term updates the local display with zero network calls', async () => {
    const rendered = await renderStep();
    await waitFor(() => expect(rendered.getByTestId('onboarding-allergy-option-id-1')).toBeTruthy());

    await act(async () => {
      fireEvent.changeText(rendered.getByTestId('onboarding-allergy-search-input'), 'quinoa em pó');
    });
    expect(rendered.getByTestId('onboarding-allergy-add-new-term')).toBeTruthy();

    await act(async () => {
      fireEvent.press(rendered.getByTestId('onboarding-allergy-add-new-term'));
    });

    expect(rendered.onAddNewTerm).toHaveBeenCalledWith('quinoa em pó');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('shows added terms passed via props with a testID per entry', async () => {
    const rendered = await renderStep({ newTerms: ['quinoa em pó'] });
    await waitFor(() => expect(rendered.getByTestId('onboarding-allergy-option-id-1')).toBeTruthy());

    expect(rendered.getByTestId('onboarding-allergy-added-term-0')).toBeTruthy();
  });

  it('toggles an approved allergen via onToggleAllergen', async () => {
    const rendered = await renderStep();
    await waitFor(() => expect(rendered.getByTestId('onboarding-allergy-option-id-1')).toBeTruthy());

    await act(async () => {
      fireEvent.press(rendered.getByTestId('onboarding-allergy-option-id-1'));
    });

    expect(rendered.onToggleAllergen).toHaveBeenCalledWith('id-1');
  });

  it('the "none" control is selected when there are no allergens or new terms, and calls onClearAllergies on press', async () => {
    const rendered = await renderStep();
    await waitFor(() => expect(rendered.getByTestId('onboarding-allergy-option-id-1')).toBeTruthy());

    expect(rendered.getByTestId('onboarding-allergy-none-button').props.accessibilityState.selected).toBe(true);

    await act(async () => {
      fireEvent.press(rendered.getByTestId('onboarding-allergy-none-button'));
    });

    expect(rendered.onClearAllergies).toHaveBeenCalledTimes(1);
  });

  it('UT-011: the "none" control un-selects once allergenIds is non-empty after being cleared', async () => {
    const rendered = await renderStep({ allergenIds: [] });
    await waitFor(() => expect(rendered.getByTestId('onboarding-allergy-option-id-1')).toBeTruthy());
    expect(rendered.getByTestId('onboarding-allergy-none-button').props.accessibilityState.selected).toBe(true);

    await act(async () => {
      await rendered.rerender(
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <OnboardingAllergiesStep
            allergenIds={['id-1']}
            newTerms={[]}
            onAddNewTerm={rendered.onAddNewTerm}
            onClearAllergies={rendered.onClearAllergies}
            onToggleAllergen={rendered.onToggleAllergen}
          />
        </QueryClientProvider>,
      );
    });

    expect(rendered.getByTestId('onboarding-allergy-none-button').props.accessibilityState.selected).toBe(false);
  });
});

describe('OnboardingAllergiesStep wired to a real useOnboardingViewModel instance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService as { getSession: jest.Mock }).getSession = jest
      .fn<() => Promise<Session | null>>()
      .mockResolvedValue(session);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => approvedAllergens,
    }) as unknown as typeof fetch;
  });

  function Harness() {
    const fakeService = {} as OnboardingService;
    const fakeCache: OfflineCache = { get: () => null, set: jest.fn(), remove: jest.fn() };
    const vm = useOnboardingViewModel(fakeService, fakeCache, { track: jest.fn() });
    return (
      <OnboardingAllergiesStep
        allergenIds={vm.allergenIds}
        newTerms={vm.newTerms}
        onAddNewTerm={vm.addNewTerm}
        onClearAllergies={vm.clearAllergies}
        onToggleAllergen={vm.toggleAllergen}
      />
    );
  }

  it('IT-001: selecting allergens then pressing "none" clears both selections', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const rendered = await render(
      <QueryClientProvider client={queryClient}>
        <Harness />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(rendered.getByTestId('onboarding-allergy-option-id-1')).toBeTruthy());

    await act(async () => {
      fireEvent.press(rendered.getByTestId('onboarding-allergy-option-id-1'));
    });
    await act(async () => {
      fireEvent.press(rendered.getByTestId('onboarding-allergy-option-id-2'));
    });

    expect(rendered.getByTestId('onboarding-allergy-option-id-1').props.accessibilityState.selected).toBe(true);
    expect(rendered.getByTestId('onboarding-allergy-option-id-2').props.accessibilityState.selected).toBe(true);
    expect(rendered.getByTestId('onboarding-allergy-none-button').props.accessibilityState.selected).toBe(false);

    await act(async () => {
      fireEvent.press(rendered.getByTestId('onboarding-allergy-none-button'));
    });

    expect(rendered.getByTestId('onboarding-allergy-option-id-1').props.accessibilityState.selected).toBe(false);
    expect(rendered.getByTestId('onboarding-allergy-option-id-2').props.accessibilityState.selected).toBe(false);
    expect(rendered.getByTestId('onboarding-allergy-none-button').props.accessibilityState.selected).toBe(true);
  });
});
