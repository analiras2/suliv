import Constants from 'expo-constants';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import { syncQueue, type QueuedAction } from '@/lib/sync-queue';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export type GuidedCookingAnalyticsEvent =
  | { type: 'guided_cook_started'; recipeId: string }
  | { type: 'guided_step_completed'; recipeId: string; stepIndex: number; hadTimer: boolean }
  | { type: 'guided_timer_started'; recipeId: string; stepIndex: number; durationSeconds: number }
  | { type: 'guided_timer_completed'; recipeId: string; stepIndex: number }
  | { type: 'guided_timer_abandoned'; recipeId: string; stepIndex: number; elapsedSeconds: number }
  | { type: 'guided_cook_finished'; recipeId: string; totalDurationSeconds: number }
  | { type: 'guided_cook_abandoned'; recipeId: string; lastStepIndex: number };

interface AnalyticsEventDto {
  sessionId: string;
  platform: 'ios' | 'android';
  appVersion: string;
  eventName: string;
  properties: Record<string, unknown>;
  occurredAt: string;
}

export interface GuidedCookingAnalyticsService {
  track(event: GuidedCookingAnalyticsEvent, isConnected: boolean): void;
  flush(): Promise<void>;
}

function buildProperties(event: GuidedCookingAnalyticsEvent): Record<string, unknown> {
  switch (event.type) {
    case 'guided_cook_started':
      return { recipe_id: event.recipeId };
    case 'guided_step_completed':
      return { recipe_id: event.recipeId, step_index: event.stepIndex, had_timer: event.hadTimer };
    case 'guided_timer_started':
      return { recipe_id: event.recipeId, step_index: event.stepIndex, duration_seconds: event.durationSeconds };
    case 'guided_timer_completed':
      return { recipe_id: event.recipeId, step_index: event.stepIndex };
    case 'guided_timer_abandoned':
      return { recipe_id: event.recipeId, step_index: event.stepIndex, elapsed_seconds: event.elapsedSeconds };
    case 'guided_cook_finished':
      return { recipe_id: event.recipeId, total_duration_seconds: event.totalDurationSeconds };
    case 'guided_cook_abandoned':
      return { recipe_id: event.recipeId, last_step_index: event.lastStepIndex };
  }
}

function buildEventDto(event: GuidedCookingAnalyticsEvent): AnalyticsEventDto {
  return {
    sessionId: SESSION_ID,
    platform: Platform.OS === 'android' ? 'android' : 'ios',
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    eventName: event.type,
    properties: buildProperties(event),
    occurredAt: new Date().toISOString(),
  };
}

function createIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function sendAnalyticsBatch(action: QueuedAction): Promise<void> {
  const { events } = action.payload as { events: AnalyticsEventDto[] };

  const response = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events, idempotencyKey: action.idempotencyKey }),
  });

  if (!response.ok) {
    throw new Error(`Events request failed with status ${response.status}.`);
  }
}

async function flush(): Promise<void> {
  await syncQueue.flush(sendAnalyticsBatch);
}

let unsubscribeReconnect: (() => void) | null = null;

function flushOnNextReconnect(): void {
  if (unsubscribeReconnect) return;

  unsubscribeReconnect = NetInfo.addEventListener((state) => {
    if (!state.isConnected) return;
    unsubscribeReconnect?.();
    unsubscribeReconnect = null;
    void flush();
  });
}

function track(event: GuidedCookingAnalyticsEvent, isConnected: boolean): void {
  const dto = buildEventDto(event);

  syncQueue.enqueue({
    idempotencyKey: createIdempotencyKey(),
    actionType: 'analytics_batch',
    payload: { events: [dto] },
    occurredAt: dto.occurredAt,
  });

  if (isConnected) {
    void flush();
  } else {
    flushOnNextReconnect();
  }
}

export const guidedCookingAnalyticsService: GuidedCookingAnalyticsService = { track, flush };
