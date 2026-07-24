import { PrismaService } from '../prisma/prisma.service';
import { IngestEventsDto } from './dto/ingest-events.dto';
import { EventsService } from './events.service';

function ingestBodyFixture(
  overrides: Partial<IngestEventsDto> = {},
): IngestEventsDto {
  return {
    events: [
      {
        sessionId: 'session-1',
        platform: 'ios',
        appVersion: '1.0.0',
        eventName: 'guided_cook_started',
        properties: { recipe_id: 'recipe-1' },
        occurredAt: new Date().toISOString(),
      },
    ],
    ...overrides,
  };
}

describe('EventsService', () => {
  const findUniqueSyncOperation = jest.fn();
  const transaction = jest.fn((operations: unknown[]) =>
    Promise.resolve(operations),
  );
  const prisma = {
    syncOperation: { findUnique: findUniqueSyncOperation, create: jest.fn() },
    analyticsEvent: { createMany: jest.fn() },
    $transaction: transaction,
  };
  let service: EventsService;

  beforeEach(() => {
    jest.clearAllMocks();
    findUniqueSyncOperation.mockResolvedValue(null);
    service = new EventsService(prisma as unknown as PrismaService);
  });

  it('UT-029 called twice with the same idempotencyKey is a no-op on the second call', async () => {
    const body = ingestBodyFixture({ idempotencyKey: 'key-1' });

    findUniqueSyncOperation.mockResolvedValueOnce(null);
    await service.ingest(body, 'user-1');
    expect(transaction).toHaveBeenCalledTimes(1);

    findUniqueSyncOperation.mockResolvedValueOnce({
      id: 'sync-op-1',
      userId: 'user-1',
      idempotencyKey: 'key-1',
      actionType: 'analytics_batch',
      appliedAt: new Date(),
    });
    await service.ingest(body, 'user-1');

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(findUniqueSyncOperation).toHaveBeenCalledWith({
      where: {
        userId_idempotencyKey: { userId: 'user-1', idempotencyKey: 'key-1' },
      },
    });
  });

  it('writes the batch without a dedup check for anonymous requests, even with an idempotencyKey', async () => {
    const body = ingestBodyFixture({ idempotencyKey: 'key-1' });

    await service.ingest(body, undefined);

    expect(findUniqueSyncOperation).not.toHaveBeenCalled();
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
