import { create } from 'zustand';

import { offlineCache } from '@/lib/offline-cache';
import { draftsSyncService } from '@/module/recipe-authoring/services/drafts-sync-service';
import type { DraftIngredient, DraftStep, RecipeDraft } from '@/module/recipe-authoring/types';

const DRAFTS_CACHE_KEY = 'cache:recipe-drafts';

interface DraftsIndex {
  drafts: Record<string, RecipeDraft>;
}

export interface RecipeDraftTextFields {
  title: string;
  description: string;
  categoryId: string | null;
  prepTimeMinutes: number | null;
  servings: number | null;
  difficulty: RecipeDraft['difficulty'];
  dietPreference: RecipeDraft['dietPreference'];
  ingredients: DraftIngredient[];
  steps: DraftStep[];
  authorMessageToModerator: string | null;
}

export interface RecipeDraftsStore {
  drafts: Record<string, RecipeDraft>;
  createDraft: () => RecipeDraft;
  updateDraft: (id: string, changes: Partial<RecipeDraftTextFields>) => void;
  setLocalImageUri: (id: string, localImageUri: string | null) => void;
  setCoverImageUrl: (id: string, coverImageUrl: string) => void;
  markSynced: (id: string, syncedAt: string) => void;
  removeDraft: (id: string) => void;
}

function loadIndex(): DraftsIndex {
  return offlineCache.get<DraftsIndex>(DRAFTS_CACHE_KEY) ?? { drafts: {} };
}

function persistIndex(drafts: Record<string, RecipeDraft>): void {
  offlineCache.set<DraftsIndex>(DRAFTS_CACHE_KEY, { drafts });
}

const initialIndex = loadIndex();

export const useRecipeDraftsStore = create<RecipeDraftsStore>((set, get) => ({
  drafts: initialIndex.drafts,

  // UT-001: generates a UUID and persists to MMKV immediately, with zero
  // network dependency — the app is usable offline from the very first tap.
  createDraft: () => {
    const now = new Date().toISOString();
    const draft: RecipeDraft = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      categoryId: null,
      prepTimeMinutes: null,
      servings: null,
      difficulty: null,
      dietPreference: null,
      ingredients: [],
      steps: [],
      authorMessageToModerator: null,
      localImageUri: null,
      coverImageUrl: null,
      lastSyncedAt: null,
      createdAt: now,
    };

    const nextDrafts = { ...get().drafts, [draft.id]: draft };
    set({ drafts: nextDrafts });
    persistIndex(nextDrafts);
    return draft;
  },

  // UT-002: every text-field update enqueues a draft_upsert carrying the full
  // current draft snapshot (drafts-sync-service excludes localImageUri itself).
  updateDraft: (id, changes) => {
    const { drafts } = get();
    const existing = drafts[id];
    if (!existing) return;

    const updated: RecipeDraft = { ...existing, ...changes };
    const nextDrafts = { ...drafts, [id]: updated };
    set({ drafts: nextDrafts });
    persistIndex(nextDrafts);

    draftsSyncService.enqueueUpsert(updated, new Date().toISOString());
  },

  // The pending local image is tracked outside draft_upsert (ADR-003) — never
  // triggers a sync-queue enqueue.
  setLocalImageUri: (id, localImageUri) => {
    const { drafts } = get();
    const existing = drafts[id];
    if (!existing) return;

    const nextDrafts = { ...drafts, [id]: { ...existing, localImageUri } };
    set({ drafts: nextDrafts });
    persistIndex(nextDrafts);
  },

  // Set locally once the image finishes uploading; attaching it server-side
  // happens via a separate PATCH /recipes/:id call (recipe-image-upload-service).
  setCoverImageUrl: (id, coverImageUrl) => {
    const { drafts } = get();
    const existing = drafts[id];
    if (!existing) return;

    const nextDrafts = { ...drafts, [id]: { ...existing, coverImageUrl, localImageUri: null } };
    set({ drafts: nextDrafts });
    persistIndex(nextDrafts);
  },

  markSynced: (id, syncedAt) => {
    const { drafts } = get();
    const existing = drafts[id];
    if (!existing) return;

    const nextDrafts = { ...drafts, [id]: { ...existing, lastSyncedAt: syncedAt } };
    set({ drafts: nextDrafts });
    persistIndex(nextDrafts);
  },

  removeDraft: (id) => {
    const { drafts } = get();
    if (!drafts[id]) return;

    const nextDrafts = { ...drafts };
    delete nextDrafts[id];
    set({ drafts: nextDrafts });
    persistIndex(nextDrafts);
  },
}));

// Keeps lastSyncedAt accurate for the "7+ days unsynced" soft warning
// (§16.3) — updated only once the server has actually confirmed the
// draft_upsert, not merely enqueued it.
draftsSyncService.onDraftSynced((draftId, syncedAt) => {
  useRecipeDraftsStore.getState().markSynced(draftId, syncedAt);
});
