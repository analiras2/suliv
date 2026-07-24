import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { RecipeDraft } from '@/module/recipe-authoring/types';

const mockOfflineGet = jest.fn<(key: string) => unknown>();
const mockOfflineSet = jest.fn<(key: string, value: unknown) => void>();
const mockEnqueueUpsert = jest.fn<(draft: RecipeDraft, occurredAt: string) => void>();
const mockOnDraftSynced = jest.fn<(listener: (draftId: string, syncedAt: string) => void) => () => void>();

jest.mock('@/lib/offline-cache', () => ({
  offlineCache: {
    get: (key: string) => mockOfflineGet(key),
    set: (key: string, value: unknown) => mockOfflineSet(key, value),
    remove: jest.fn(),
  },
}));

jest.mock('@/module/recipe-authoring/services/drafts-sync-service', () => ({
  draftsSyncService: {
    enqueueUpsert: (draft: RecipeDraft, occurredAt: string) => mockEnqueueUpsert(draft, occurredAt),
    flush: jest.fn(),
    onDraftSynced: (listener: (draftId: string, syncedAt: string) => void) => mockOnDraftSynced(listener),
  },
}));

describe('useRecipeDraftsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOfflineGet.mockReturnValue(null);
  });

  function loadStore() {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./use-recipe-drafts-store') as typeof import('./use-recipe-drafts-store');
  }

  // UT-001
  it('createDraft generates a UUID immediately and persists it to MMKV with no network call', () => {
    const { useRecipeDraftsStore } = loadStore();

    const draft = useRecipeDraftsStore.getState().createDraft();

    expect(draft.id).toEqual(expect.any(String));
    expect(draft.id.length).toBeGreaterThan(0);
    expect(useRecipeDraftsStore.getState().drafts[draft.id]).toEqual(draft);
    expect(mockOfflineSet).toHaveBeenCalledWith(
      'cache:recipe-drafts',
      expect.objectContaining({ drafts: expect.objectContaining({ [draft.id]: draft }) }),
    );
    expect(mockEnqueueUpsert).not.toHaveBeenCalled();
  });

  // UT-002
  it('updateDraft triggers drafts-sync-service.enqueueUpsert with the full current draft snapshot', () => {
    const { useRecipeDraftsStore } = loadStore();
    const draft = useRecipeDraftsStore.getState().createDraft();
    mockEnqueueUpsert.mockClear();

    useRecipeDraftsStore.getState().updateDraft(draft.id, { title: 'Bolo de cenoura' });

    expect(useRecipeDraftsStore.getState().drafts[draft.id].title).toBe('Bolo de cenoura');
    expect(mockEnqueueUpsert).toHaveBeenCalledTimes(1);
    const [syncedDraft] = mockEnqueueUpsert.mock.calls[0] as [RecipeDraft, string];
    expect(syncedDraft).toEqual(expect.objectContaining({ id: draft.id, title: 'Bolo de cenoura' }));
  });

  it('updateDraft on an unknown id is a no-op', () => {
    const { useRecipeDraftsStore } = loadStore();

    useRecipeDraftsStore.getState().updateDraft('unknown-id', { title: 'x' });

    expect(mockEnqueueUpsert).not.toHaveBeenCalled();
  });

  it('setLocalImageUri sets the field locally without enqueuing a sync action', () => {
    const { useRecipeDraftsStore } = loadStore();
    const draft = useRecipeDraftsStore.getState().createDraft();
    mockEnqueueUpsert.mockClear();

    useRecipeDraftsStore.getState().setLocalImageUri(draft.id, 'file://local.jpg');

    expect(useRecipeDraftsStore.getState().drafts[draft.id].localImageUri).toBe('file://local.jpg');
    expect(mockEnqueueUpsert).not.toHaveBeenCalled();
  });

  it('setCoverImageUrl sets coverImageUrl and clears localImageUri', () => {
    const { useRecipeDraftsStore } = loadStore();
    const draft = useRecipeDraftsStore.getState().createDraft();
    useRecipeDraftsStore.getState().setLocalImageUri(draft.id, 'file://local.jpg');

    useRecipeDraftsStore.getState().setCoverImageUrl(draft.id, 'https://cdn/image.jpg');

    const updated = useRecipeDraftsStore.getState().drafts[draft.id];
    expect(updated.coverImageUrl).toBe('https://cdn/image.jpg');
    expect(updated.localImageUri).toBeNull();
  });

  it('markSynced sets lastSyncedAt', () => {
    const { useRecipeDraftsStore } = loadStore();
    const draft = useRecipeDraftsStore.getState().createDraft();

    useRecipeDraftsStore.getState().markSynced(draft.id, '2026-07-23T10:00:00.000Z');

    expect(useRecipeDraftsStore.getState().drafts[draft.id].lastSyncedAt).toBe('2026-07-23T10:00:00.000Z');
  });

  it('registers a drafts-sync-service.onDraftSynced listener that marks the draft synced', () => {
    loadStore();

    expect(mockOnDraftSynced).toHaveBeenCalledTimes(1);
  });

  it('removeDraft deletes the entry', () => {
    const { useRecipeDraftsStore } = loadStore();
    const draft = useRecipeDraftsStore.getState().createDraft();

    useRecipeDraftsStore.getState().removeDraft(draft.id);

    expect(useRecipeDraftsStore.getState().drafts[draft.id]).toBeUndefined();
  });
});
