import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type RateLimitWindow = 'day';

export interface RateLimitCheck {
  allowed: boolean;
}

function startOfWindow(window: RateLimitWindow, now: Date): Date {
  // Only the calendar day (UTC, like every other daily limit in the API) exists today.
  const start = new Date(now);
  if (window === 'day') start.setUTCHours(0, 0, 0, 0);
  return start;
}

/**
 * Counts domain actions per user in the shared `rate_limit_events` table.
 * It never reads a feature's own tables, so any action can be limited.
 */
@Injectable()
export class RateLimitService {
  constructor(private readonly prisma: PrismaService) {}

  /** Whether one more `action` still fits in the user's current window. */
  async isAllowed(
    userId: string,
    action: string,
    limit: number,
    window: RateLimitWindow,
  ): Promise<boolean> {
    const used = await this.prisma.rateLimitEvent.count({
      where: {
        userId,
        action,
        occurredAt: { gte: startOfWindow(window, new Date()) },
      },
    });
    return used < limit;
  }

  async record(userId: string, action: string): Promise<void> {
    await this.prisma.rateLimitEvent.create({
      data: { userId, action, occurredAt: new Date() },
    });
  }

  /**
   * Counts and, when still under the limit, records the call. A rejected
   * call writes nothing.
   */
  async checkAndRecord(
    userId: string,
    action: string,
    limit: number,
    window: RateLimitWindow,
  ): Promise<RateLimitCheck> {
    const allowed = await this.isAllowed(userId, action, limit, window);
    if (allowed) await this.record(userId, action);
    return { allowed };
  }
}
