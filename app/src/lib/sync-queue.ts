import { offlineCache } from '@/lib/offline-cache';

const SYNC_QUEUE_CACHE_KEY = 'cache:sync-queue';

export type SyncActionType =
  | 'analytics_batch'
  | 'favorite_add'
  | 'favorite_remove'
  | 'draft_upsert';

export interface QueuedAction {
  idempotencyKey: string;
  actionType: SyncActionType;
  payload: unknown;
  occurredAt: string;
}

export interface SyncQueue {
  enqueue(action: QueuedAction): void;
  flush(send: (action: QueuedAction) => Promise<void>): Promise<void>;
}

function readQueue(): QueuedAction[] {
  return offlineCache.get<QueuedAction[]>(SYNC_QUEUE_CACHE_KEY) ?? [];
}

function writeQueue(queue: QueuedAction[]): void {
  offlineCache.set(SYNC_QUEUE_CACHE_KEY, queue);
}

export const syncQueue: SyncQueue = {
  enqueue(action: QueuedAction): void {
    const queue = readQueue();
    queue.push(action);
    writeQueue(queue);
  },

  async flush(send: (action: QueuedAction) => Promise<void>): Promise<void> {
    const queue = readQueue();

    while (queue.length > 0) {
      try {
        await send(queue[0]);
      } catch {
        return;
      }
      queue.shift();
      writeQueue(queue);
    }
  },
};
