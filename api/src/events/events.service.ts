import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IngestEventsDto } from './dto/ingest-events.dto';

const ANALYTICS_BATCH_ACTION_TYPE = 'analytics_batch';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async ingest(body: IngestEventsDto, userId?: string): Promise<void> {
    // Idempotency dedup requires a stable identity to key on. `sync_operations`
    // requires a non-null `userId` (schema §3.19), so anonymous submissions
    // (no JWT) skip the dedup check entirely and always write their batch.
    if (body.idempotencyKey && userId) {
      const alreadyApplied = await this.prisma.syncOperation.findUnique({
        where: {
          userId_idempotencyKey: {
            userId,
            idempotencyKey: body.idempotencyKey,
          },
        },
      });
      if (alreadyApplied) {
        return;
      }
    }

    await this.prisma.$transaction([
      this.prisma.analyticsEvent.createMany({
        data: body.events.map((event) => ({
          userId: userId ?? null,
          sessionId: event.sessionId,
          platform: event.platform,
          appVersion: event.appVersion,
          eventName: event.eventName,
          // Validated as a plain object by @IsObject() on the DTO, so it's
          // already JSON-safe at runtime; Prisma's Json field just needs the type asserted.
          properties: event.properties as Prisma.InputJsonValue,
          occurredAt: new Date(event.occurredAt),
        })),
      }),
      ...(body.idempotencyKey && userId
        ? [
            this.prisma.syncOperation.create({
              data: {
                userId,
                idempotencyKey: body.idempotencyKey,
                actionType: ANALYTICS_BATCH_ACTION_TYPE,
              },
            }),
          ]
        : []),
    ]);
  }
}
