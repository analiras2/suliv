import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReportStatus, ReportTargetType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log.service';
import { ReportDto, ResolveReportAction } from './dto';

const PENDING_PAGE_SIZE = 20;

export interface PaginatedAdminReports {
  items: ReportDto[];
  nextCursor: string | null;
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), 'utf8').toString('base64');
}

function decodeCursor(cursor: string): number {
  const offset = Number(Buffer.from(cursor, 'base64').toString('utf8'));
  return Number.isInteger(offset) && offset >= 0 ? offset : 0;
}

@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listPending(
    status?: ReportStatus,
    cursor?: string,
  ): Promise<PaginatedAdminReports> {
    const offset = cursor ? decodeCursor(cursor) : 0;
    const where: Prisma.ReportWhereInput = {
      status: status ?? ReportStatus.pending,
    };

    const reports = await this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: PENDING_PAGE_SIZE + 1,
    });

    const hasMore = reports.length > PENDING_PAGE_SIZE;
    const page = hasMore ? reports.slice(0, PENDING_PAGE_SIZE) : reports;

    return {
      items: page.map((report) => ReportDto.fromReport(report)),
      nextCursor: hasMore ? encodeCursor(offset + page.length) : null,
    };
  }

  async resolve(
    adminId: string,
    reportId: string,
    action: ResolveReportAction,
  ): Promise<void> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (
      action === 'hide_content' &&
      report.targetType !== ReportTargetType.comment
    ) {
      throw new BadRequestException(
        'hide_content only applies to a comment-targeted report',
      );
    }
    if (
      action === 'reopen_recipe' &&
      report.targetType !== ReportTargetType.recipe
    ) {
      throw new BadRequestException(
        'reopen_recipe only applies to a recipe-targeted report',
      );
    }

    if (action === 'hide_content') {
      await this.prisma.commentRating.update({
        where: { id: report.targetId },
        data: { status: 'hidden' },
      });
    } else if (action === 'reopen_recipe') {
      await this.prisma.recipe.update({
        where: { id: report.targetId },
        data: { status: 'em_analise' },
      });
    }

    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.reviewed, reviewedByAdminId: adminId },
    });

    this.auditLogService.log({
      adminId,
      action: 'resolve',
      targetId: reportId,
    });
  }
}
