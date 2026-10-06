import NetInfo from '@react-native-community/netinfo';

import { apiRequest } from '@/lib/api-client';
import { syncQueue, type QueuedAction } from '@/lib/sync-queue';
import type { RecipeAuthoringPayload, RecipeDraft } from '@/module/recipe-authoring/types';

export interface DraftsSyncService {
  enqueueUpsert(draft: RecipeDraft, occurredAt: string): void; // text fields only, excludes localImageUri
  flush(): Promise<void>;
  onDraftSynced(listener: (draftId: string, syncedAt: string) => void): () => void;
}

function createIdempotencyKey(): string {
  // Non-cryptographic use: only needs to be unique for dedup, not unguessable.
  // eslint-disable-next-line sonarjs/pseudo-random
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// CreateRecipeDto (api/src/recipes/dto/create-recipe.dto.ts) requires all of
// these fields, with ingredients/steps needing at least one entry. Queuing a
// draft_upsert before the draft satisfies this contract makes the server
// reject it, and that failed action then blocks every later valid update
// behind it in the FIFO sync queue.
function isSyncable(draft: RecipeDraft): boolean {
  return (
    draft.categoryId !== null &&
    draft.prepTimeMinutes !== null &&
    draft.servings !== null &&
    draft.difficulty !== null &&
    draft.dietPreference !== null &&
    draft.ingredients.length > 0 &&
    draft.steps.length > 0
  );
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

// POST /sync currently responds 201, not 200 — the client accepts any 2xx, never an
// exact status code (see workflow memory: known SyncController quirk). A failure of
// any kind rejects here, which leaves the action queued (sync-queue).
async function sendSyncAction(action: QueuedAction): Promise<void> {
  await apiRequest('/sync', {
    method: 'POST',
    body: {
      actions: [
        {
          type: action.actionType,
          payload: action.payload,
          idempotency_key: action.idempotencyKey,
        },
      ],
    },
  });

  if (action.actionType === 'draft_upsert') {
    const { id: draftId } = action.payload as { id: string };
    const syncedAt = new Date().toISOString();
    for (const listener of syncedListeners) listener(draftId, syncedAt);
  }
}

async function flush(): Promise<void> {
  await syncQueue.flush(sendSyncAction);
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
  if (!isSyncable(draft)) return;

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
