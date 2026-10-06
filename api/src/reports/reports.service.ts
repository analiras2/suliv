import { Injectable, Logger } from '@nestjs/common';
import { ApiException } from '../errors/api-exception';
import { Prisma, Report, ReportReason, ReportTargetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const MAX_REPORTS_PER_DAY = 10;

export interface CreateReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  freeText?: string;
}

function todayUtc(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(reporterId: string, input: CreateReportInput): Promise<Report> {
    await this.assertTargetExists(input.targetType, input.targetId);
    await this.enforceRateLimit(reporterId);

    try {
      return await this.prisma.report.create({
        data: {
          reporterUserId: reporterId,
          targetType: input.targetType,
          targetId: input.targetId,
          reason: input.reason,
          freeText: input.freeText,
        },
      });
    } catch (error: unknown) {
      if (this.isDuplicateReport(error)) {
        throw new ApiException(
          'REPORT_DUPLICATE',
          'You have already reported this content',
        );
      }
      throw error;
    }
  }

  private async assertTargetExists(
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<void> {
    const exists =
      targetType === ReportTargetType.recipe
        ? await this.prisma.recipe.findUnique({ where: { id: targetId } })
        : await this.prisma.commentRating.findUnique({
            where: { id: targetId },
          });

    if (!exists) {
      throw new ApiException(
        'REPORT_TARGET_NOT_FOUND',
        'Report target not found',
      );
    }
  }

  private async enforceRateLimit(reporterId: string): Promise<void> {
    const reportsToday = await this.prisma.report.count({
      where: { reporterUserId: reporterId, createdAt: { gte: todayUtc() } },
    });

    if (reportsToday >= MAX_REPORTS_PER_DAY) {
      this.logger.warn(
        `Rate limit exceeded for user ${reporterId} on reports (${reportsToday} reports today)`,
      );
      throw new ApiException(
        'REPORT_RATE_LIMITED',
        'Rate limit exceeded: maximum 10 reports per day',
      );
    }
  }

  private isDuplicateReport(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
