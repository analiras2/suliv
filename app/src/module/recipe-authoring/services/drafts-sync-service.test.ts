import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { RecipeDraft } from '@/module/recipe-authoring/types';

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

const originalFetch = global.fetch;

function buildDraft(overrides: Partial<RecipeDraft> = {}): RecipeDraft {
  return {
    id: 'draft-1',
    title: 'Bolo',
    description: 'Descrição',
    categoryId: 'cat-1',
    prepTimeMinutes: 30,
    servings: 4,
    difficulty: 'iniciante',
    dietPreference: 'vegano',
    ingredients: [{ name: 'Farinha', quantity: 1, unit: 'kg', scalesWithServings: true, order: 0 }],
    steps: [{ order: 0, description: 'Misture', stepTimeSeconds: null }],
    authorMessageToModerator: null,
    localImageUri: 'file://local-cover.jpg',
    coverImageUrl: null,
    lastSyncedAt: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('draftsSyncService', () => {
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
    return require('./drafts-sync-service') as typeof import('./drafts-sync-service');
  }

  it('enqueueUpsert pushes a draft_upsert action whose payload excludes localImageUri', () => {
    const { draftsSyncService } = loadService();
    netInfoListener({ isConnected: false });
    mockEnqueue.mockClear();

    draftsSyncService.enqueueUpsert(buildDraft(), '2026-07-23T10:00:00.000Z');

    expect(mockEnqueue).toHaveBeenCalledTimes(1);
    const [action] = mockEnqueue.mock.calls[0] as [QueuedAction];
    expect(action.actionType).toBe('draft_upsert');
    expect(action.payload).not.toHaveProperty('localImageUri');
    expect(action.payload).not.toHaveProperty('lastSyncedAt');
    expect(action.payload).not.toHaveProperty('createdAt');
    expect(action.payload).toEqual(
      expect.objectContaining({ id: 'draft-1', title: 'Bolo', categoryId: 'cat-1' }),
    );
  });

  it('enqueueUpsert flushes immediately when already connected', () => {
    const { draftsSyncService } = loadService();
    netInfoListener({ isConnected: true });
    mockFlush.mockClear();

    draftsSyncService.enqueueUpsert(buildDraft(), '2026-07-23T10:00:00.000Z');

    expect(mockFlush).toHaveBeenCalled();
  });

  it('enqueueUpsert does not flush while disconnected', () => {
    const { draftsSyncService } = loadService();
    netInfoListener({ isConnected: false });
    mockFlush.mockClear();

    draftsSyncService.enqueueUpsert(buildDraft(), '2026-07-23T10:00:00.000Z');

    expect(mockFlush).not.toHaveBeenCalled();
  });

  it('flush() posts a draft_upsert action to POST /sync and tolerates a 201 response', async () => {
    const { draftsSyncService } = loadService();
    netInfoListener({ isConnected: true });
    mockFlush.mockClear();
    fetchMock.mockResolvedValue({ ok: true, status: 201 });

    await draftsSyncService.flush();

    const [send] = mockFlush.mock.calls[mockFlush.mock.calls.length - 1] as [
      (action: QueuedAction) => Promise<void>,
    ];
    const action: QueuedAction = {
      idempotencyKey: 'key-1',
      actionType: 'draft_upsert',
      payload: { id: 'draft-1' },
      occurredAt: '2026-07-23T10:00:00.000Z',
    };

    await expect(send(action)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/sync'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          actions: [{ type: 'draft_upsert', payload: { id: 'draft-1' }, idempotency_key: 'key-1' }],
        }),
      }),
    );
  });

  it('a failed sync request rejects instead of silently succeeding', async () => {
    const { draftsSyncService } = loadService();
    netInfoListener({ isConnected: true });
    mockFlush.mockClear();
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    const [send] = (() => {
      draftsSyncService.enqueueUpsert(buildDraft(), '2026-07-23T10:00:00.000Z');
      return mockFlush.mock.calls[mockFlush.mock.calls.length - 1] as [
        (action: QueuedAction) => Promise<void>,
      ];
    })();

    await expect(
      send({ idempotencyKey: 'key-2', actionType: 'draft_upsert', payload: { id: 'draft-1' }, occurredAt: 'x' }),
    ).rejects.toThrow();
  });

  it('onDraftSynced fires after a draft_upsert action sends successfully', async () => {
    const { draftsSyncService } = loadService();
    netInfoListener({ isConnected: true });
    fetchMock.mockResolvedValue({ ok: true, status: 201 });
    const listener = jest.fn();
    draftsSyncService.onDraftSynced(listener);
    mockFlush.mockClear();

    draftsSyncService.enqueueUpsert(buildDraft({ id: 'draft-42' }), '2026-07-23T10:00:00.000Z');
    const [send] = mockFlush.mock.calls[mockFlush.mock.calls.length - 1] as [
      (action: QueuedAction) => Promise<void>,
    ];
    await send({ idempotencyKey: 'k', actionType: 'draft_upsert', payload: { id: 'draft-42' }, occurredAt: 'x' });

    expect(listener).toHaveBeenCalledWith('draft-42', expect.any(String));
  });

  it('onDraftSynced returns an unsubscribe function', async () => {
    const { draftsSyncService } = loadService();
    netInfoListener({ isConnected: true });
    fetchMock.mockResolvedValue({ ok: true, status: 201 });
    const listener = jest.fn();
    const unsubscribe = draftsSyncService.onDraftSynced(listener);
    unsubscribe();
    mockFlush.mockClear();

    draftsSyncService.enqueueUpsert(buildDraft(), '2026-07-23T10:00:00.000Z');
    const [send] = mockFlush.mock.calls[mockFlush.mock.calls.length - 1] as [
      (action: QueuedAction) => Promise<void>,
    ];
    await send({ idempotencyKey: 'k', actionType: 'draft_upsert', payload: { id: 'draft-1' }, occurredAt: 'x' });

    expect(listener).not.toHaveBeenCalled();
  });
});
