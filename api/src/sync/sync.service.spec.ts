import { FavoritesService } from '../favorites/favorites.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecipesService } from '../recipes/recipes.service';
import { SyncAction, SyncService } from './sync.service';

function draftUpsertAction(overrides: Partial<SyncAction> = {}): SyncAction {
  return {
    type: 'draft_upsert',
    payload: {
      id: 'recipe-1',
      title: 'Panqueca',
      description: 'Panqueca fofinha',
      categoryId: 'category-1',
      prepTimeMinutes: 15,
      servings: 2,
      difficulty: 'iniciante',
      dietPreference: 'vegano',
      ingredients: [
        {
          name: 'Banana',
          quantity: 2,
          unit: 'unidade',
          scalesWithServings: true,
          order: 1,
        },
      ],
      steps: [{ order: 1, description: 'Misture tudo.', stepTimeSeconds: 60 }],
    },
    idempotencyKey: 'draft-key-1',
    ...overrides,
  };
}

function favoriteAddAction(overrides: Partial<SyncAction> = {}): SyncAction {
  return {
    type: 'favorite_add',
    payload: { recipeId: 'recipe-1', occurredAt: new Date().toISOString() },
    idempotencyKey: 'key-1',
    ...overrides,
  };
}

describe('SyncService', () => {
  const findUniqueSyncOperation = jest.fn();
  const createSyncOperation = jest.fn();
  const txSyncOperationCreate = jest.fn();
  const transaction = jest.fn(
    (
      arg: unknown[] | ((tx: unknown) => Promise<unknown>),
    ): Promise<unknown> => {
      if (typeof arg === 'function') {
        return arg({ syncOperation: { create: txSyncOperationCreate } });
      }
      return Promise.resolve(arg);
    },
  );
  const prisma = {
    syncOperation: {
      findUnique: findUniqueSyncOperation,
      create: createSyncOperation,
    },
    $transaction: transaction,
  };
  const buildAddOperations = jest.fn(() => ['add-op-1', 'add-op-2']);
  const buildRemoveOperations = jest.fn(() => ['remove-op-1']);
  const favoritesService = {
    buildAddOperations,
    buildRemoveOperations,
  };
  const parseCreateRecipePayload = jest.fn((payload: unknown) => payload);
  const upsertDraftWithClient = jest.fn().mockResolvedValue({ id: 'recipe-1' });
  const recipesService = {
    parseCreateRecipePayload,
    upsertDraftWithClient,
  };
  let service: SyncService;

  beforeEach(() => {
    jest.clearAllMocks();
    findUniqueSyncOperation.mockResolvedValue(null);
    parseCreateRecipePayload.mockImplementation((payload: unknown) => payload);
    upsertDraftWithClient.mockResolvedValue({ id: 'recipe-1' });
    service = new SyncService(
      prisma as unknown as PrismaService,
      favoritesService as unknown as FavoritesService,
      recipesService as unknown as RecipesService,
    );
  });

  it('applies the valid action and reports an unrecognized type without throwing', async () => {
    const actions: SyncAction[] = [
      favoriteAddAction({ idempotencyKey: 'key-1' }),
      {
        type: 'some_unknown_action',
        payload: {},
        idempotencyKey: 'key-2',
      },
    ];

    const result = await service.apply('user-1', actions);

    expect(result).toEqual({
      appliedCount: 1,
      rejectedTypes: ['some_unknown_action'],
    });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(buildAddOperations).toHaveBeenCalledWith('user-1', 'recipe-1');
  });

  it('applying the same idempotencyKey twice is a no-op on the second call', async () => {
    const actions = [favoriteAddAction({ idempotencyKey: 'key-1' })];

    findUniqueSyncOperation.mockResolvedValueOnce(null);
    const first = await service.apply('user-1', actions);
    expect(first).toEqual({ appliedCount: 1, rejectedTypes: [] });
    expect(transaction).toHaveBeenCalledTimes(1);

    findUniqueSyncOperation.mockResolvedValueOnce({
      id: 'sync-op-1',
      userId: 'user-1',
      idempotencyKey: 'key-1',
      actionType: 'favorite_add',
      appliedAt: new Date(),
    });
    const second = await service.apply('user-1', actions);

    expect(second).toEqual({ appliedCount: 1, rejectedTypes: [] });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('dispatches favorite_remove actions against FavoritesService.buildRemoveOperations', async () => {
    const actions: SyncAction[] = [
      {
        type: 'favorite_remove',
        payload: { recipeId: 'recipe-2', occurredAt: new Date().toISOString() },
        idempotencyKey: 'key-3',
      },
    ];

    await service.apply('user-1', actions);

    expect(buildRemoveOperations).toHaveBeenCalledWith('user-1', 'recipe-2');
  });

  it('UT-003 draft_upsert delegates to RecipesService.upsertDraftWithClient and records the sync operation', async () => {
    const action = draftUpsertAction();

    const result = await service.apply('user-1', [action]);

    expect(result).toEqual({ appliedCount: 1, rejectedTypes: [] });
    expect(parseCreateRecipePayload).toHaveBeenCalledWith(action.payload);
    const [tx, userId, payload] = upsertDraftWithClient.mock.calls[0] as [
      { syncOperation: unknown },
      string,
      unknown,
    ];
    expect(tx.syncOperation).toBeDefined();
    expect(userId).toBe('user-1');
    expect(payload).toBe(action.payload);
    expect(txSyncOperationCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        idempotencyKey: 'draft-key-1',
        actionType: 'draft_upsert',
      },
    });
  });

  it('UT-004 a second draft_upsert for the same recipeId is applied through the same upsert path (replaces ingredients/steps)', async () => {
    const first = draftUpsertAction({ idempotencyKey: 'draft-key-1' });
    const second = draftUpsertAction({
      idempotencyKey: 'draft-key-2',
      payload: {
        ...(first.payload as Record<string, unknown>),
        ingredients: [
          {
            name: 'Aveia',
            quantity: 1,
            unit: 'xicara',
            scalesWithServings: true,
            order: 1,
          },
        ],
      },
    });

    await service.apply('user-1', [first]);
    await service.apply('user-1', [second]);

    expect(upsertDraftWithClient).toHaveBeenCalledTimes(2);
    expect(upsertDraftWithClient).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      'user-1',
      second.payload,
    );
  });

  it('draft_upsert with an invalid payload propagates the validation error without applying anything', async () => {
    parseCreateRecipePayload.mockImplementationOnce(() => {
      throw new Error('Invalid draft_upsert payload');
    });

    await expect(
      service.apply('user-1', [draftUpsertAction()]),
    ).rejects.toThrow('Invalid draft_upsert payload');
    expect(upsertDraftWithClient).not.toHaveBeenCalled();
  });
});
