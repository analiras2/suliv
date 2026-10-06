import { createAllergenTerm, fetchRecipes } from './api-client';

const HTTP_CONFLICT = 409;
const HTTP_SERVER_ERROR = 500;

function answer(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (body === undefined) throw new SyntaxError('Unexpected end of JSON input');
      return body;
    },
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  } as unknown as Response;
}

describe('admin api-client errors', () => {
  const fetchMock = jest.fn<Promise<Response>, [string, RequestInit?]>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('UT-064 throws an ApiError with the code and status of a coded failure', async () => {
    fetchMock.mockResolvedValue(answer(HTTP_CONFLICT, { statusCode: HTTP_CONFLICT, code: 'ALLERGEN_TERM_DUPLICATE' }));

    await expect(createAllergenTerm('allergen-1', 'leite')).rejects.toMatchObject({
      code: 'ALLERGEN_TERM_DUPLICATE',
      status: HTTP_CONFLICT,
    });
  });

  it('keeps validation details from a VALIDATION_FAILED body', async () => {
    const details = [{ field: 'term', constraint: 'minLength' }];
    fetchMock.mockResolvedValue(answer(400, { code: 'VALIDATION_FAILED', details }));

    await expect(createAllergenTerm('allergen-1', '')).rejects.toMatchObject({ code: 'VALIDATION_FAILED', details });
  });

  it('UT-065 turns a 5xx without a JSON body into SERVER_UNAVAILABLE', async () => {
    fetchMock.mockResolvedValue(answer(HTTP_SERVER_ERROR));

    await expect(fetchRecipes()).rejects.toMatchObject({ code: 'SERVER_UNAVAILABLE', status: HTTP_SERVER_ERROR });
  });

  it('turns an unknown code into UNKNOWN_ERROR keeping the raw code', async () => {
    fetchMock.mockResolvedValue(answer(HTTP_CONFLICT, { code: 'SOMETHING_NEW' }));

    await expect(fetchRecipes()).rejects.toMatchObject({
      code: 'UNKNOWN_ERROR',
      status: HTTP_CONFLICT,
      rawCode: 'SOMETHING_NEW',
    });
  });

  it('treats a code meant only for the app as unknown to the panel', async () => {
    fetchMock.mockResolvedValue(answer(HTTP_CONFLICT, { code: 'USERNAME_TAKEN' }));

    await expect(fetchRecipes()).rejects.toMatchObject({ code: 'UNKNOWN_ERROR', rawCode: 'USERNAME_TAKEN' });
  });

  it('reports NETWORK_UNAVAILABLE when the request never gets a response', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(fetchRecipes()).rejects.toMatchObject({ code: 'NETWORK_UNAVAILABLE', status: null });
  });
});
