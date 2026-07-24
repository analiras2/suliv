import NetInfo from '@react-native-community/netinfo';

import { authService, type AuthService } from '@/module/auth/services/auth-service';
import { syncQueue, type QueuedAction } from '@/lib/sync-queue';
import type { RecipeAuthoringPayload, RecipeDraft } from '@/module/recipe-authoring/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface DraftsSyncService {
  enqueueUpsert(draft: RecipeDraft, occurredAt: string): void; // text fields only, excludes localImageUri
  flush(): Promise<void>;
  onDraftSynced(listener: (draftId: string, syncedAt: string) => void): () => void;
}

function createIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// draft_upsert's wire payload matches CreateRecipePayload verbatim (ADR-003):
// localImageUri, coverImageUrl-when-absent, lastSyncedAt, and createdAt are
// local-only bookkeeping and must never reach the server.
function toWirePayload(draft: RecipeDraft): Partial<RecipeAuthoringPayload> & { id: string } {
  const payload: Partial<RecipeAuthoringPayload> & { id: string } = {
    id: draft.id,
    title: draft.title,
    description: draft.description,
    ingredients: draft.ingredients,
    steps: draft.steps,
  };
  if (draft.categoryId !== null) payload.categoryId = draft.categoryId;
  if (draft.prepTimeMinutes !== null) payload.prepTimeMinutes = draft.prepTimeMinutes;
  if (draft.servings !== null) payload.servings = draft.servings;
  if (draft.difficulty !== null) payload.difficulty = draft.difficulty;
  if (draft.dietPreference !== null) payload.dietPreference = draft.dietPreference;
  if (draft.authorMessageToModerator !== null) payload.authorMessageToModerator = draft.authorMessageToModerator;
  if (draft.coverImageUrl !== null) payload.coverImageUrl = draft.coverImageUrl;
  return payload;
}

const syncedListeners = new Set<(draftId: string, syncedAt: string) => void>();

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

  // POST /sync currently responds 201, not 200 — check response.ok, never an
  // exact status code (see workflow memory: known SyncController quirk).
  if (!response.ok) {
    throw new Error(`Sync request failed with status ${response.status}.`);
  }

  if (action.actionType === 'draft_upsert') {
    const { id: draftId } = action.payload as { id: string };
    const syncedAt = new Date().toISOString();
    for (const listener of syncedListeners) listener(draftId, syncedAt);
  }
}

async function flush(): Promise<void> {
  await syncQueue.flush((action) => sendSyncAction(action, authService));
}

// Mirrors favorites-sync-service.ts's precedent: a plain module needing a
// reconnect trigger subscribes to NetInfo directly, since network-status.ts
// only exposes a React hook.
let isConnected = true;
NetInfo.addEventListener((state) => {
  isConnected = Boolean(state.isConnected);
  if (isConnected) void flush();
});

function enqueueUpsert(draft: RecipeDraft, occurredAt: string): void {
  syncQueue.enqueue({
    idempotencyKey: createIdempotencyKey(),
    actionType: 'draft_upsert',
    payload: toWirePayload(draft),
    occurredAt,
  });
  if (isConnected) void flush();
}

function onDraftSynced(listener: (draftId: string, syncedAt: string) => void): () => void {
  syncedListeners.add(listener);
  return () => syncedListeners.delete(listener);
}

export const draftsSyncService: DraftsSyncService = { enqueueUpsert, flush, onDraftSynced };
