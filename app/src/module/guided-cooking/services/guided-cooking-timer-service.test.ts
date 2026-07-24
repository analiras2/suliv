import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockGetPermissionsAsync = jest.fn<() => Promise<{ status: string }>>();
const mockRequestPermissionsAsync = jest.fn<() => Promise<{ status: string }>>();
const mockScheduleNotificationAsync = jest.fn<(request: unknown) => Promise<string>>();
const mockCancelScheduledNotificationAsync = jest.fn<(id: string) => Promise<void>>();

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
  getPermissionsAsync: () => mockGetPermissionsAsync(),
  requestPermissionsAsync: () => mockRequestPermissionsAsync(),
  scheduleNotificationAsync: (request: unknown) => mockScheduleNotificationAsync(request),
  cancelScheduledNotificationAsync: (id: string) => mockCancelScheduledNotificationAsync(id),
}));

// eslint-disable-next-line import/first
import { guidedCookingTimerService } from './guided-cooking-timer-service';

describe('guided-cooking-timer-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockScheduleNotificationAsync.mockResolvedValue('notification-1');
  });

  // UT-011
  it('schedule(0, 60) calls scheduleNotificationAsync with a 60-second trigger', async () => {
    const timer = await guidedCookingTimerService.schedule(0, 60);

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ type: 'timeInterval', seconds: 60 }),
      }),
    );
    expect(timer).toEqual(
      expect.objectContaining({ stepIndex: 0, durationSeconds: 60, notificationId: 'notification-1' }),
    );
  });

  // UT-012
  it('requests permission just-in-time when not yet granted, before scheduling', async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });

    await guidedCookingTimerService.schedule(1, 30);

    expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  // UT-012
  it('resolves an ActiveTimer instead of throwing when permission is denied', async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'denied' });

    const timer = await guidedCookingTimerService.schedule(2, 45);

    expect(timer).toEqual(
      expect.objectContaining({ stepIndex: 2, durationSeconds: 45, notificationId: 'notification-1' }),
    );
  });

  it('does not re-request permission when already granted', async () => {
    await guidedCookingTimerService.schedule(0, 10);

    expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('cancel calls cancelScheduledNotificationAsync with the given id', async () => {
    await guidedCookingTimerService.cancel('notification-1');

    expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith('notification-1');
  });

  it('hasElapsed returns true once Date.now() reaches endsAt', () => {
    const timer = { stepIndex: 0, durationSeconds: 1, endsAt: Date.now() - 1, notificationId: 'n' };

    expect(guidedCookingTimerService.hasElapsed(timer)).toBe(true);
  });

  it('hasElapsed returns false before endsAt', () => {
    const timer = { stepIndex: 0, durationSeconds: 60, endsAt: Date.now() + 60_000, notificationId: 'n' };

    expect(guidedCookingTimerService.hasElapsed(timer)).toBe(false);
  });
});
