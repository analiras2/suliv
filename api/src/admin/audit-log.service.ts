import { Injectable, Logger } from '@nestjs/common';

// Every admin domain service (recipes, reports, allergens, boosts) calls this
// after each mutating action, per docs/03-tdd.md §9's "toda ação de
// moderação... fica com log de quem/quando". Operational logging only, not a
// PRD analytics event.
export type AuditLogAction =
  | 'approve'
  | 'request-adjustment'
  | 'resolve'
  | 'allergen-approve'
  | 'allergen-reject'
  | 'boost-create'
  | 'feature-flag-update';

export interface AuditLogEntry {
  adminId: string;
  action: AuditLogAction;
  targetId: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  log(entry: AuditLogEntry): void {
    this.logger.log({ ...entry, timestamp: new Date().toISOString() });
  }
}
