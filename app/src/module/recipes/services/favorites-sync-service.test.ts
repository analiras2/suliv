import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

type NetInfoState = { isConnected: boolean | null };
type NetInfoListener = (state: NetInfoState) => void;

interface QueuedAction {
  idempotencyKey: string;
  actionType: string;
  payload: unknown;
  occurredAt: string;
}

const mockEnqueue = jest.fn<(action: QueuedAction) => void>();
const mockFlush = jest.fn<(send: (action: QueuedAction) => Promise<void>) => Promise<void>>();
const mockAddEventListener = jest.fn<(listener: NetInfoListener) => () => void>();
const mockGetSession = jest.fn<() => Promise<{ access_token: string } | null>>();
const mockTrack = jest.fn();

let netInfoListener: NetInfoListener = () => {};

jest.mock('@/lib/sync-queue', () => ({
  syncQueue: {
    enqueue: (action: QueuedAction) => mockEnqueue(action),
    flush: (send: (action: QueuedAction) => Promise<void>) => mockFlush(send),
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: (listener: NetInfoListener) => mockAddEventListener(listener),
  },
}));

jest.mock('@/module/auth/services/auth-service', () => ({
  authService: { getSession: () => mockGetSession() },
}));

jest.mock('@/lib/analytics', () => ({
  analyticsClient: { track: (event: string, properties: unknown) => mockTrack(event, properties) },
}));

const originalFetch = global.fetch;

describe('favoritesSyncService', () => {
  let fetchMock: jest.Mock<(...args: Parameters<typeof fetch>) => Promise<Partial<Response>>>;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockFlush.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ access_token: 'token-123' });
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    mockAddEventListener.mockImplementation((listener) => {
      netInfoListener = listener;
      return jest.fn();
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  function loadService() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./favorites-sync-service') as typeof import('./favorites-sync-service');
  }

  // UT-006
  it('enqueueAdd while disconnected pushes a favorite_add action onto sync-queue with no network call', () => {
    const { favoritesSyncService } = loadService();
    netInfoListener({ isConnected: false });
    mockFlush.mockClear();

    favoritesSyncService.enqueueAdd('recipe-1', '2026-07-23T10:00:00.000Z');

    expect(mockEnqueue).toHaveBeenCalledTimes(1);
    const [action] = mockEnqueue.mock.calls[0] as [QueuedAction];
    expect(action.actionType).toBe('favorite_add');
    expect(action.payload).toEqual({ recipeId: 'recipe-1', occurredAt: '2026-07-23T10:00:00.000Z' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // UT-007
  it('flush() while connected posts the queued actions to POST /sync in FIFO order', async () => {
    const { favoritesSyncService } = loadService();
    netInfoListener({ isConnected: true });
    mockFlush.mockClear();
    fetchMock.mockResolvedValue({ ok: true });

    await favoritesSyncService.flush();

    expect(mockFlush).toHaveBeenCalledTimes(1);
    const [send] = mockFlush.mock.calls[mockFlush.mock.calls.length - 1] as [(action: QueuedAction) => Promise<void>];

    const first: QueuedAction = {
      idempotencyKey: 'key-1',
      actionType: 'favorite_add',
      payload: { recipeId: 'recipe-1', occurredAt: '2026-07-23T10:00:00.000Z' },
      occurredAt: '2026-07-23T10:00:00.000Z',
    };
    await send(first);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/sync'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          actions: [{ type: 'favorite_add', payload: first.payload, idempotency_key: 'key-1' }],
        }),
      }),
    );
  });

  // UT-008 (inferred scope per task_02's gap note)
  it('a drained queue sends nothing on a subsequent flush()', async () => {
    const { favoritesSyncService } = loadService();
    netInfoListener({ isConnected: true });
    mockFlush.mockClear();
    mockFlush.mockImplementation(async () => undefined);

    await favoritesSyncService.flush();
    await favoritesSyncService.flush();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  // UT-015
  it('enqueueAdd immediately fires favorite_saved { offline: true }, independent of flush', () => {
    const { favoritesSyncService } = loadService();
    netInfoListener({ isConnected: false });
    mockFlush.mockClear();

    favoritesSyncService.enqueueAdd('recipe-1', '2026-07-23T10:00:00.000Z');

    expect(mockTrack).toHaveBeenCalledWith('favorite_saved', { recipe_id: 'recipe-1', offline: true });
    expect(mockFlush).not.toHaveBeenCalled();
  });

  // UT-016
  it('fires favorite_saved_offline exactly once on confirmed sync of an offline-originated add', async () => {
    const { favoritesSyncService } = loadService();
    netInfoListener({ isConnected: false });
    fetchMock.mockResolvedValue({ ok: true });

    favoritesSyncService.enqueueAdd('recipe-1', '2026-07-23T10:00:00.000Z');
    const [enqueuedAction] = mockEnqueue.mock.calls[0] as [QueuedAction];

    mockFlush.mockClear();
    mockTrack.mockClear();
    mockFlush.mockImplementation(async (send) => {
      await send(enqueuedAction);
    });

    await favoritesSyncService.flush();

    expect(mockTrack).toHaveBeenCalledWith('favorite_saved_offline', {
      recipe_id: 'recipe-1',
      idempotency_key: enqueuedAction.idempotencyKey,
    });
    expect(mockTrack).toHaveBeenCalledTimes(1); // only favorite_saved_offline (favorite_saved already cleared)

    mockTrack.mockClear();
    mockFlush.mockImplementation(async (send) => {
      await send(enqueuedAction);
    });
    await favoritesSyncService.flush();
    expect(mockTrack).not.toHaveBeenCalledWith('favorite_saved_offline', expect.anything());
  });

  it('does not fire favorite_saved_offline for an action enqueued and flushed while already online', async () => {
    const { favoritesSyncService } = loadService();
    netInfoListener({ isConnected: true });
    fetchMock.mockResolvedValue({ ok: true });

    favoritesSyncService.enqueueAdd('recipe-2', '2026-07-23T11:00:00.000Z');
    const [enqueuedAction] = mockEnqueue.mock.calls[0] as [QueuedAction];

    mockFlush.mockClear();
    mockTrack.mockClear();
    mockFlush.mockImplementation(async (send) => {
      await send(enqueuedAction);
    });

    await favoritesSyncService.flush();

    expect(mockTrack).not.toHaveBeenCalledWith('favorite_saved_offline', expect.anything());
  });
});
