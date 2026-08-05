import { Injectable, Logger } from '@nestjs/common';

// Placeholder for the `notificacoes` feature's real FCM send path
// (documented interface: .compozy/tasks/notificacoes/_techspec.md). Callers
// (e.g. admin recipe moderation) treat this as best-effort and never let its
// outcome affect their own state transitions (ADR-003 there: send() never
// throws). Swap this file's body for the real implementation once that
// feature lands — the call sites are already written against this shape.
export type NotificationType = 'recipe_approved' | 'recipe_needs_adjustment';

export interface NotificationPayload {
  recipeTitle: string;
  adjustmentReason?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async send(
    userId: string,
    type: NotificationType,
    payload: NotificationPayload,
  ): Promise<void> {
    this.logger.log({ userId, type, ...payload });
    return Promise.resolve();
  }
}
