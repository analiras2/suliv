import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockGet = jest.fn<(key: string) => QueuedAction[] | null>();
const mockSet = jest.fn<(key: string, value: QueuedAction[]) => void>();

jest.mock('@/lib/offline-cache', () => ({
  offlineCache: {
    get: (key: string) => mockGet(key),
    set: (key: string, value: QueuedAction[]) => mockSet(key, value),
    remove: jest.fn(),
  },
}));

// eslint-disable-next-line import/first
import { syncQueue, type QueuedAction } from './sync-queue';

const SYNC_QUEUE_CACHE_KEY = 'cache:sync-queue';

function makeAction(idempotencyKey: string): QueuedAction {
  return {
    idempotencyKey,
    actionType: 'analytics_batch',
    payload: { event: idempotencyKey },
    occurredAt: '2026-07-18T00:00:00.000Z',
  };
}

describe('syncQueue', () => {
  let stored: QueuedAction[];

  beforeEach(() => {
    jest.clearAllMocks();
    stored = [];
    mockGet.mockImplementation(() => stored);
    mockSet.mockImplementation((_key: string, value: QueuedAction[]) => {
      stored = value;
    });
  });

  // UT-022
  it('flushes every queued action in FIFO order when send always resolves', async () => {
    syncQueue.enqueue(makeAction('a'));
    syncQueue.enqueue(makeAction('b'));
    syncQueue.enqueue(makeAction('c'));

    const send = jest.fn<(action: QueuedAction) => Promise<void>>().mockResolvedValue(undefined);
    await syncQueue.flush(send);

    expect(send.mock.calls.map(([action]) => action.idempotencyKey)).toEqual(['a', 'b', 'c']);
    expect(stored).toEqual([]);
  });

  // UT-023
  it('stops draining at the first failure, leaving that action and later ones queued', async () => {
    syncQueue.enqueue(makeAction('a'));
    syncQueue.enqueue(makeAction('b'));
    syncQueue.enqueue(makeAction('c'));

    const send = jest
      .fn<(action: QueuedAction) => Promise<void>>()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('network down'));
    await syncQueue.flush(send);

    expect(send).toHaveBeenCalledTimes(2);
    expect(stored.map((action) => action.idempotencyKey)).toEqual(['b', 'c']);
  });

  // UT-024
  it('invokes send zero times on a second flush after a successful first flush', async () => {
    syncQueue.enqueue(makeAction('a'));
    const send = jest.fn<(action: QueuedAction) => Promise<void>>().mockResolvedValue(undefined);

    await syncQueue.flush(send);
    send.mockClear();
    await syncQueue.flush(send);

    expect(send).not.toHaveBeenCalled();
  });

  it('persists enqueued actions under the cache:sync-queue key', () => {
    syncQueue.enqueue(makeAction('a'));

    expect(mockSet).toHaveBeenCalledWith(SYNC_QUEUE_CACHE_KEY, [makeAction('a')]);
  });
});
