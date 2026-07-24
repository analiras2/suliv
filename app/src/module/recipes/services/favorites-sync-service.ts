import NetInfo from '@react-native-community/netinfo';

import { analyticsClient } from '@/lib/analytics';
import { authService, type AuthService } from '@/module/auth/services/auth-service';
import { syncQueue, type QueuedAction } from '@/lib/sync-queue';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface FavoriteActionPayload {
  recipeId: string;
  occurredAt: string;
}

export interface FavoritesSyncService {
  enqueueAdd(recipeId: string, occurredAt: string): void;
  enqueueRemove(recipeId: string, occurredAt: string): void;
  flush(): Promise<void>;
}

function createIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Tracks idempotencyKeys enqueued while disconnected, so `favorite_saved_offline`
// fires only for adds that actually originated offline (UT-016), not for an
// action enqueued and flushed while already online.
const offlineOriginatedKeys = new Set<string>();

async function sendSyncAction(action: QueuedAction, authentication: AuthService): Promise<void> {
  const session = await authentication.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session) headers.Authorization = `Bearer ${session.access_token}`;

  const response = await fetch(`${API_BASE_URL}/sync`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      actions: [
        {
          type: action.actionType,
          payload: action.payload,
          idempotency_key: action.idempotencyKey,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Sync request failed with status ${response.status}.`);
  }

  if (action.actionType === 'favorite_add' && offlineOriginatedKeys.has(action.idempotencyKey)) {
    offlineOriginatedKeys.delete(action.idempotencyKey);
    const { recipeId } = action.payload as FavoriteActionPayload;
    analyticsClient.track('favorite_saved_offline', {
      recipe_id: recipeId,
      idempotency_key: action.idempotencyKey,
    });
  }
}

async function flush(): Promise<void> {
  await syncQueue.flush((action) => sendSyncAction(action, authService));
}

// NetInfo delivers the current connectivity to the listener immediately on
// subscribe, then again on every change (see network-status.ts) — this single
// subscription both covers "flush immediately if already connected" and "flush
// on the next reconnect event" (ADR-001) without a React lifecycle.
let isConnected = true;
NetInfo.addEventListener((state) => {
  isConnected = Boolean(state.isConnected);
  if (isConnected) void flush();
});

function enqueue(actionType: 'favorite_add' | 'favorite_remove', recipeId: string, occurredAt: string): void {
  const idempotencyKey = createIdempotencyKey();

  if (actionType === 'favorite_add' && !isConnected) {
    offlineOriginatedKeys.add(idempotencyKey);
  }

  const payload: FavoriteActionPayload = { recipeId, occurredAt };
  syncQueue.enqueue({ idempotencyKey, actionType, payload, occurredAt });
}

function enqueueAdd(recipeId: string, occurredAt: string): void {
  enqueue('favorite_add', recipeId, occurredAt);
  analyticsClient.track('favorite_saved', { recipe_id: recipeId, offline: !isConnected });
}

function enqueueRemove(recipeId: string, occurredAt: string): void {
  enqueue('favorite_remove', recipeId, occurredAt);
  analyticsClient.track('favorite_removed', { recipe_id: recipeId });
}

export const favoritesSyncService: FavoritesSyncService = { enqueueAdd, enqueueRemove, flush };
