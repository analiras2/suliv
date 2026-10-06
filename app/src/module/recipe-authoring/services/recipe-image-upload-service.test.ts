import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ERROR_MESSAGES } from '@/lib/error-messages';
import type { RecipeDraft } from '@/module/recipe-authoring/types';

type NetInfoState = { isConnected: boolean | null };
type NetInfoListener = (state: NetInfoState) => void;

const mockAddEventListener = jest.fn<(listener: NetInfoListener) => () => void>();
const mockSetCoverImageUrl = jest.fn<(id: string, coverImageUrl: string) => void>();
const mockAuthoringUpdate = jest.fn<(id: string, payload: unknown) => Promise<unknown>>();
const mockNetInfoFetch = jest.fn<() => Promise<NetInfoState>>();

let netInfoListener: NetInfoListener = () => {};
let mockStoreDrafts: Record<string, RecipeDraft> = {};

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: (listener: NetInfoListener) => mockAddEventListener(listener),
    fetch: () => mockNetInfoFetch(),
  },
}));

jest.mock('@/module/auth/services/auth-service', () => ({
  authService: { getSession: jest.fn(async () => ({ access_token: 'token' })) },
}));

jest.mock('@/module/recipe-authoring/store/use-recipe-drafts-store', () => ({
  useRecipeDraftsStore: {
    getState: () => ({
      drafts: mockStoreDrafts,
      setCoverImageUrl: mockSetCoverImageUrl,
    }),
  },
}));

jest.mock('@/module/recipe-authoring/services/recipe-authoring-service', () => ({
  recipeAuthoringService: { update: (id: string, payload: unknown) => mockAuthoringUpdate(id, payload) },
}));

const originalFetch = global.fetch;

async function flushMicrotasks(times = 15): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
}

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
    ingredients: [],
    steps: [],
    authorMessageToModerator: null,
    localImageUri: 'file://local-cover.jpg',
    coverImageUrl: null,
    lastSyncedAt: '2026-07-20T00:00:00.000Z',
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('recipeImageUploadService', () => {
  let fetchMock: jest.Mock<(...args: Parameters<typeof fetch>) => Promise<Partial<Response>>>;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockStoreDrafts = {};
    mockNetInfoFetch.mockResolvedValue({ isConnected: true });
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
    return require('./recipe-image-upload-service') as typeof import('./recipe-image-upload-service');
  }

  const signature = {
    signature: 'sig',
    timestamp: 111,
    apiKey: 'key',
    cloudName: 'cloud',
    uploadPreset: 'preset',
  };

  // UT-005
  it('upload() calls the signature endpoint then uploads to Cloudinary, resolving the final URL', async () => {
    const { recipeImageUploadService } = loadService();
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => signature } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ secure_url: 'https://cdn/img.jpg' }) } as Response);

    const url = await recipeImageUploadService.upload('file://local.jpg');

    expect(url).toBe('https://cdn/img.jpg');
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/uploads/recipe-image-signature'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('https://api.cloudinary.com/v1_1/cloud/image/upload'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  // UT-006
  it('a signature request failure rejects without attempting a Cloudinary call', async () => {
    const { recipeImageUploadService } = loadService();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 } as Response);

    await expect(recipeImageUploadService.upload('file://local.jpg')).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // UT-007
  it('a fresh reconnect auto-triggers upload for a draft with a pending image whose text fields already synced', async () => {
    const { getImageUploadState } = loadService();
    mockStoreDrafts = { 'draft-1': buildDraft() };
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => signature } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ secure_url: 'https://cdn/img.jpg' }) } as Response);
    mockAuthoringUpdate.mockResolvedValue({});

    netInfoListener({ isConnected: false });
    netInfoListener({ isConnected: true });

    await flushMicrotasks();

    expect(fetchMock).toHaveBeenCalled();
    expect(getImageUploadState('draft-1').status).toBe('success');
    expect(mockSetCoverImageUrl).toHaveBeenCalledWith('draft-1', 'https://cdn/img.jpg');
  });

  it('retries a failed attach PATCH on the next reconnect until it succeeds', async () => {
    const { attemptAutoUpload, hasPendingCoverAttach } = loadService();
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => signature } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ secure_url: 'https://cdn/img.jpg' }) } as Response);
    mockAuthoringUpdate.mockRejectedValueOnce(new Error('network error'));

    await attemptAutoUpload('draft-1', 'file://local.jpg');

    expect(mockAuthoringUpdate).toHaveBeenCalledTimes(1);
    expect(hasPendingCoverAttach('draft-1')).toBe(true);

    mockAuthoringUpdate.mockResolvedValueOnce({});
    netInfoListener({ isConnected: false });
    netInfoListener({ isConnected: true });
    await flushMicrotasks();

    expect(mockAuthoringUpdate).toHaveBeenCalledTimes(2);
    expect(mockAuthoringUpdate).toHaveBeenLastCalledWith('draft-1', { coverImageUrl: 'https://cdn/img.jpg' });
    expect(hasPendingCoverAttach('draft-1')).toBe(false);
  });

  it('does not auto-upload a draft whose text fields have never synced (lastSyncedAt null)', async () => {
    mockStoreDrafts = { 'draft-1': buildDraft({ lastSyncedAt: null }) };
    loadService();

    netInfoListener({ isConnected: false });
    netInfoListener({ isConnected: true });
    await Promise.resolve();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  // UT-008
  it('upload failing 3 times in a row stops auto-retrying and surfaces a manual retry state', async () => {
    const { attemptAutoUpload, getImageUploadState, MAX_AUTO_RETRY_ATTEMPTS } = loadService();
    fetchMock.mockResolvedValue({ ok: false, status: 500 } as Response);

    for (let attempt = 0; attempt < MAX_AUTO_RETRY_ATTEMPTS; attempt += 1) {
      await attemptAutoUpload('draft-1', 'file://local.jpg');
    }

    expect(getImageUploadState('draft-1')).toEqual(
      expect.objectContaining({ status: 'needs_manual_retry', attempts: MAX_AUTO_RETRY_ATTEMPTS }),
    );

    const callsBeforeFourthAttempt = fetchMock.mock.calls.length;
    await attemptAutoUpload('draft-1', 'file://local.jpg');

    // the 4th attempt never calls the network at all
    expect(fetchMock.mock.calls).toHaveLength(callsBeforeFourthAttempt);
  });

  // UT-062
  it('a Cloudinary 400 stores the image-upload copy and increments the attempts', async () => {
    const { attemptAutoUpload, getImageUploadState } = loadService();
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => signature } as Response)
      .mockResolvedValueOnce({ ok: false, status: 400 } as Response);

    await attemptAutoUpload('draft-1', 'file://local.jpg');

    expect(getImageUploadState('draft-1')).toEqual({
      status: 'error',
      attempts: 1,
      error: ERROR_MESSAGES.IMAGE_UPLOAD_FAILED,
    });
  });

  // UT-063
  it('a Cloudinary request without a response while offline stores the offline copy', async () => {
    const { attemptAutoUpload, getImageUploadState } = loadService();
    mockNetInfoFetch.mockResolvedValue({ isConnected: false });
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => signature } as Response)
      .mockRejectedValueOnce(new TypeError('Network request failed'));

    await attemptAutoUpload('draft-1', 'file://local.jpg');

    expect(getImageUploadState('draft-1').error).toBe(ERROR_MESSAGES.NETWORK_OFFLINE);
  });
});
