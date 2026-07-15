import type { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

jest.mock('@/module/auth/services/auth-service', () => ({ authService: {} }));

// eslint-disable-next-line import/first
import { authService } from '@/module/auth/services/auth-service';
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

function renderStep(props?: Partial<React.ComponentProps<typeof OnboardingAllergiesStep>>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onToggleAllergen = jest.fn();
  const onAddNewTerm = jest.fn();
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <OnboardingAllergiesStep
        allergenIds={[]}
        newTerms={[]}
        onToggleAllergen={onToggleAllergen}
        onAddNewTerm={onAddNewTerm}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { ...rendered, onToggleAllergen, onAddNewTerm };
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
    const rendered = renderStep();

    for (const allergen of approvedAllergens) {
      await waitFor(() => expect(rendered.getByTestId(`onboarding-allergy-option-${allergen.id}`)).toBeTruthy());
    }
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('IT-002: filters the rendered list as the user types with no additional network request', async () => {
    const rendered = renderStep();
    await waitFor(() => expect(rendered.getByTestId('onboarding-allergy-option-id-1')).toBeTruthy());

    await act(async () => {
      fireEvent.changeText(rendered.getByTestId('onboarding-allergy-search-input'), 'leit');
    });

    expect(rendered.getByTestId('onboarding-allergy-option-id-1')).toBeTruthy();
    expect(rendered.queryByTestId('onboarding-allergy-option-id-2')).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('IT-003: adding a new free-text term updates the local display with zero network calls', async () => {
    const rendered = renderStep();
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
    const rendered = renderStep({ newTerms: ['quinoa em pó'] });
    await waitFor(() => expect(rendered.getByTestId('onboarding-allergy-option-id-1')).toBeTruthy());

    expect(rendered.getByTestId('onboarding-allergy-added-term-0')).toBeTruthy();
  });

  it('toggles an approved allergen via onToggleAllergen', async () => {
    const rendered = renderStep();
    await waitFor(() => expect(rendered.getByTestId('onboarding-allergy-option-id-1')).toBeTruthy());

    await act(async () => {
      fireEvent.press(rendered.getByTestId('onboarding-allergy-option-id-1'));
    });

    expect(rendered.onToggleAllergen).toHaveBeenCalledWith('id-1');
  });
});
