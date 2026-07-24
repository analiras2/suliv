import { PrismaService } from '../prisma/prisma.service';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  const upsertFavorite = jest.fn();
  const deleteManyFavorite = jest.fn();
  const upsertRecipeDailyStats = jest.fn();
  const findUniqueSyncOperation = jest.fn();
  const transaction = jest.fn((operations: unknown[]) =>
    Promise.resolve(operations),
  );
  const prisma = {
    favorite: { upsert: upsertFavorite, deleteMany: deleteManyFavorite },
    recipeDailyStats: { upsert: upsertRecipeDailyStats },
    syncOperation: { findUnique: findUniqueSyncOperation },
    $transaction: transaction,
  };
  let service: FavoritesService;

  beforeEach(() => {
    jest.clearAllMocks();
    findUniqueSyncOperation.mockResolvedValue(null);
    deleteManyFavorite.mockResolvedValue({ count: 0 });
    service = new FavoritesService(prisma as unknown as PrismaService);
  });

  it('UT-017 add creates the Favorite row and increments favorites_added for today', async () => {
    await service.add('user-1', 'recipe-1');

    expect(transaction).toHaveBeenCalledTimes(1);
    const operations = transaction.mock.calls[0][0];
    expect(operations).toHaveLength(2);
    expect(upsertFavorite).toHaveBeenCalledWith({
      where: { userId_recipeId: { userId: 'user-1', recipeId: 'recipe-1' } },
      update: {},
      create: { userId: 'user-1', recipeId: 'recipe-1' },
    });
    expect(upsertRecipeDailyStats).toHaveBeenCalledTimes(1);
    const [statsCall] = upsertRecipeDailyStats.mock.calls[0] as [
      {
        where: { recipeId_date: { recipeId: string; date: Date } };
        update: { favoritesAdded: { increment: number } };
        create: { recipeId: string; favoritesAdded: number };
      },
    ];
    expect(statsCall.where.recipeId_date.recipeId).toBe('recipe-1');
    expect(statsCall.update).toEqual({ favoritesAdded: { increment: 1 } });
    expect(statsCall.create).toEqual(
      expect.objectContaining({ recipeId: 'recipe-1', favoritesAdded: 1 }),
    );
  });

  it('UT-018 remove for a non-favorited recipe no-ops without throwing', async () => {
    await expect(
      service.remove('user-1', 'recipe-never-favorited'),
    ).resolves.toBeUndefined();

    expect(deleteManyFavorite).toHaveBeenCalledWith({
      where: { userId: 'user-1', recipeId: 'recipe-never-favorited' },
    });
  });
});
