import { Request } from 'express';
import { AuthenticatedUser } from '../auth/supabase-jwt.strategy';
import { PaginatedRecipes } from '../ranking/paginated-recipes.dto';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

describe('SearchController', () => {
  const search = jest.fn<
    Promise<PaginatedRecipes>,
    Parameters<SearchService['search']>
  >();
  const searchService = { search };
  let controller: SearchController;

  beforeEach(() => {
    jest.clearAllMocks();
    search.mockResolvedValue({ items: [], nextCursor: null });
    controller = new SearchController(
      searchService as unknown as SearchService,
    );
  });

  function requestFor(userId: string): Request & { user: AuthenticatedUser } {
    return {
      user: { id: userId, email: `${userId}@example.com` },
    } as Request & { user: AuthenticatedUser };
  }

  it('UT-006 treats a request with no origin parameter as busca', async () => {
    await controller.search(requestFor('user-1'), {});

    expect(search).toHaveBeenCalledWith(
      'user-1',
      'busca',
      expect.any(Object),
      undefined,
    );
  });

  it('passes an explicit origin through unchanged', async () => {
    await controller.search(requestFor('user-1'), { origin: 'top_semana' });

    expect(search).toHaveBeenCalledWith(
      'user-1',
      'top_semana',
      expect.any(Object),
      undefined,
    );
  });

  it('normalizes a single allergens query value into an array', async () => {
    await controller.search(requestFor('user-1'), { allergens: 'allergen-1' });

    expect(search).toHaveBeenCalledWith(
      'user-1',
      'busca',
      expect.objectContaining({ allergens: ['allergen-1'] }),
      undefined,
    );
  });
});
