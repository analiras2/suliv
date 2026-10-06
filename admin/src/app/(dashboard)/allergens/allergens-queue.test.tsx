import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ERROR_MESSAGES } from '@/lib/error-messages';
import { AllergensQueue } from './allergens-queue';

const mockFetch = jest.fn<Promise<Response>, [string, RequestInit?]>();
const HTTP_OK = 200;
const HTTP_CONFLICT = 409;

function jsonAnswer(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

const approvedAllergen = { id: 'allergen-1', name: 'Leite', status: 'approved', ingredientTerms: [] };

describe('AllergensQueue term errors', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('IT-022 renders the admin copy for a duplicate term answered with ALLERGEN_TERM_DUPLICATE', async () => {
    mockFetch.mockImplementation(async (url, init) => {
      if (url.includes('status=pending')) return jsonAnswer(HTTP_OK, []);
      if (url.includes('status=approved')) return jsonAnswer(HTTP_OK, [approvedAllergen]);
      expect(init?.method).toBe('POST');
      return jsonAnswer(HTTP_CONFLICT, { statusCode: HTTP_CONFLICT, code: 'ALLERGEN_TERM_DUPLICATE', message: 'exists' });
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <AllergensQueue />
      </QueryClientProvider>,
    );

    fireEvent.change(await screen.findByLabelText('New ingredient term'), { target: { value: 'leite integral' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar termo' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(ERROR_MESSAGES.ALLERGEN_TERM_DUPLICATE));
    expect(screen.queryByText('exists')).not.toBeInTheDocument();
  });
});
