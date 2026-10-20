import { PrismaService } from '../../prisma/prisma.service';
import { RateLimitService } from './rate-limit.service';

const NOW = new Date('2026-10-06T15:00:00.000Z');
const START_OF_DAY = new Date('2026-10-06T00:00:00.000Z');

function createService(countToday: number) {
  const prisma = {
    rateLimitEvent: {
      count: jest.fn().mockResolvedValue(countToday),
      create: jest.fn().mockResolvedValue({}),
    },
  };
  const service = new RateLimitService(prisma as unknown as PrismaService);
  return { service, prisma };
}

describe('RateLimitService.checkAndRecord', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // UT-004
  it('allows and records a call below the limit', async () => {
    const { service, prisma } = createService(4);

    await expect(
      service.checkAndRecord('user-1', 'recipe_submit', 5, 'day'),
    ).resolves.toEqual({ allowed: true });
    expect(prisma.rateLimitEvent.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', action: 'recipe_submit', occurredAt: NOW },
    });
  });

  // UT-005
  it('rejects a call at the limit without writing a row', async () => {
    const { service, prisma } = createService(5);

    await expect(
      service.checkAndRecord('user-1', 'recipe_submit', 5, 'day'),
    ).resolves.toEqual({ allowed: false });
    expect(prisma.rateLimitEvent.create).not.toHaveBeenCalled();
  });

  // UT-006
  it('only counts events from the start of the current UTC day', async () => {
    const { service, prisma } = createService(0);

    await expect(
      service.checkAndRecord('user-1', 'recipe_submit', 1, 'day'),
    ).resolves.toEqual({ allowed: true });
    expect(prisma.rateLimitEvent.count).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        action: 'recipe_submit',
        occurredAt: { gte: START_OF_DAY },
      },
    });
  });
});
