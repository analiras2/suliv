import * as Notifications from 'expo-notifications';

export interface ActiveTimer {
  stepIndex: number;
  durationSeconds: number;
  endsAt: number;
  notificationId: string;
}

export interface GuidedCookingTimerService {
  schedule(stepIndex: number, durationSeconds: number): Promise<ActiveTimer>;
  cancel(notificationId: string): Promise<void>;
  hasElapsed(timer: ActiveTimer): boolean;
}

// expo-notifications is a native module: after adding it, a dev-client rebuild
// (`npx expo prebuild` + native build) is required before on-device verification (ADR-001).

async function ensurePermission(): Promise<void> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return;
  await Notifications.requestPermissionsAsync();
}

async function schedule(stepIndex: number, durationSeconds: number): Promise<ActiveTimer> {
  await ensurePermission();

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Timer finalizado',
      body: 'A etapa do preparo chegou ao fim.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: durationSeconds,
    },
  });

  return {
    stepIndex,
    durationSeconds,
    endsAt: Date.now() + durationSeconds * 1000,
    notificationId,
  };
}

async function cancel(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

function hasElapsed(timer: ActiveTimer): boolean {
  return Date.now() >= timer.endsAt;
}

export const guidedCookingTimerService: GuidedCookingTimerService = {
  schedule,
  cancel,
  hasElapsed,
};
