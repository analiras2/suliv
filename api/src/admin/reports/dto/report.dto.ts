import { Report } from '@prisma/client';

export class ReportDto {
  id!: string;
  targetType!: Report['targetType'];
  targetId!: string;
  reason!: Report['reason'];
  freeText!: string | null;
  status!: Report['status'];
  createdAt!: Date;

  static fromReport(report: Report): ReportDto {
    return {
      id: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      freeText: report.freeText,
      status: report.status,
      createdAt: report.createdAt,
    };
  }
}
