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
const mockUnsubscribe = jest.fn();
const mockGetSession = jest.fn<() => Promise<{ access_token: string } | null>>();

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

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.0.0' } },
}));

jest.mock('@/module/auth/services/auth-service', () => ({
  authService: { getSession: () => mockGetSession() },
}));

// eslint-disable-next-line import/first
import { guidedCookingAnalyticsService, type GuidedCookingAnalyticsEvent } from './guided-cooking-analytics-service';

const originalFetch = global.fetch;

describe('guidedCookingAnalyticsService', () => {
  let fetchMock: jest.Mock<(...args: Parameters<typeof fetch>) => Promise<Partial<Response>>>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFlush.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ access_token: 'token-123' });
    mockAddEventListener.mockImplementation(() => mockUnsubscribe);
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('enqueues a single analytics_batch action per tracked event with a fresh idempotencyKey', () => {
    guidedCookingAnalyticsService.track({ type: 'guided_cook_started', recipeId: 'recipe-1' }, true);
    guidedCookingAnalyticsService.track({ type: 'guided_cook_started', recipeId: 'recipe-1' }, true);

    expect(mockEnqueue).toHaveBeenCalledTimes(2);
    const [firstAction] = mockEnqueue.mock.calls[0] as [QueuedAction];
    const [secondAction] = mockEnqueue.mock.calls[1] as [QueuedAction];
    expect(firstAction.actionType).toBe('analytics_batch');
    expect(firstAction.idempotencyKey).not.toEqual(secondAction.idempotencyKey);
    expect(firstAction.payload).toEqual({
      events: [
        expect.objectContaining({
          eventName: 'guided_cook_started',
          properties: { recipe_id: 'recipe-1' },
        }),
      ],
    });
  });

  it('flushes immediately when track is called while connected', () => {
    guidedCookingAnalyticsService.track({ type: 'guided_cook_started', recipeId: 'recipe-1' }, true);

    expect(mockFlush).toHaveBeenCalledTimes(1);
    expect(mockAddEventListener).not.toHaveBeenCalled();
  });

  // IT-003
  it('attaches Authorization: Bearer <access_token> to /events for an authenticated session', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    guidedCookingAnalyticsService.track({ type: 'guided_cook_started', recipeId: 'recipe-1' }, true);

    const [send] = mockFlush.mock.calls[mockFlush.mock.calls.length - 1] as [(action: QueuedAction) => Promise<void>];
    const [action] = mockEnqueue.mock.calls[mockEnqueue.mock.calls.length - 1] as [QueuedAction];
    await send(action);

    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/events'),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-123' },
      }),
    );
  });

  it('omits the Authorization header for an anonymous session', async () => {
    mockGetSession.mockResolvedValue(null);
    fetchMock.mockResolvedValue({ ok: true });
    guidedCookingAnalyticsService.track({ type: 'guided_cook_started', recipeId: 'recipe-1' }, true);

    const [send] = mockFlush.mock.calls[mockFlush.mock.calls.length - 1] as [(action: QueuedAction) => Promise<void>];
    const [action] = mockEnqueue.mock.calls[mockEnqueue.mock.calls.length - 1] as [QueuedAction];
    await send(action);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/events'),
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
  });

  // UT-021
  it('enqueues while offline and flushes exactly once, without duplication, on reconnect', () => {
    let reconnectListener: NetInfoListener = () => {};
    mockAddEventListener.mockImplementation((listener) => {
      reconnectListener = listener;
      return mockUnsubscribe;
    });

    guidedCookingAnalyticsService.track({ type: 'guided_cook_abandoned', recipeId: 'recipe-1', lastStepIndex: 2 }, false);

    expect(mockEnqueue).toHaveBeenCalledTimes(1);
    expect(mockFlush).not.toHaveBeenCalled();

    reconnectListener({ isConnected: true });
    expect(mockFlush).toHaveBeenCalledTimes(1);
    // Unsubscribing after the first fire is what stops a real NetInfo listener from
    // re-triggering flush on later reconnect events, avoiding duplicate drains.
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ type: 'guided_cook_started', recipeId: 'r1' }, { recipe_id: 'r1' }],
    [
      { type: 'guided_step_completed', recipeId: 'r1', stepIndex: 1, hadTimer: true },
      { recipe_id: 'r1', step_index: 1, had_timer: true },
    ],
    [
      { type: 'guided_timer_started', recipeId: 'r1', stepIndex: 1, durationSeconds: 60 },
      { recipe_id: 'r1', step_index: 1, duration_seconds: 60 },
    ],
    [
      { type: 'guided_timer_completed', recipeId: 'r1', stepIndex: 1 },
      { recipe_id: 'r1', step_index: 1 },
    ],
    [
      { type: 'guided_timer_abandoned', recipeId: 'r1', stepIndex: 1, elapsedSeconds: 30 },
      { recipe_id: 'r1', step_index: 1, elapsed_seconds: 30 },
    ],
    [
      { type: 'guided_cook_finished', recipeId: 'r1', totalDurationSeconds: 600 },
      { recipe_id: 'r1', total_duration_seconds: 600 },
    ],
    [
      { type: 'guided_cook_abandoned', recipeId: 'r1', lastStepIndex: 3 },
      { recipe_id: 'r1', last_step_index: 3 },
    ],
  ] as [GuidedCookingAnalyticsEvent, Record<string, unknown>][])('builds the PRD §18.1 payload for %o', (event, properties) => {
    guidedCookingAnalyticsService.track(event, true);

    const [action] = mockEnqueue.mock.calls[mockEnqueue.mock.calls.length - 1] as [QueuedAction];
    const payload = action.payload as { events: { eventName: string; properties: unknown }[] };
    expect(payload.events[0]).toEqual(expect.objectContaining({ eventName: event.type, properties }));
  });
});
