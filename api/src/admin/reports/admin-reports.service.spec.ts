import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Report } from '@prisma/client';
import { AuditLogService } from '../audit-log.service';
import { AdminReportsService } from './admin-reports.service';

function reportFixture(overrides: Partial<Report> = {}): Report {
  return {
    id: 'report-1',
    reporterUserId: 'user-1',
    targetType: 'comment',
    targetId: 'comment-1',
    reason: 'spam',
    freeText: null,
    status: 'pending',
    reviewedByAdminId: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('AdminReportsService', () => {
  const findUniqueReport = jest.fn();
  const updateReport = jest.fn();
  const updateCommentRating = jest.fn();
  const updateRecipe = jest.fn();
  const prisma = {
    report: { findUnique: findUniqueReport, update: updateReport },
    commentRating: { update: updateCommentRating },
    recipe: { update: updateRecipe },
  };
  const auditLog = jest.fn();
  const auditLogService = { log: auditLog } as unknown as AuditLogService;

  let service: AdminReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    updateReport.mockResolvedValue(reportFixture({ status: 'reviewed' }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new AdminReportsService(prisma as any, auditLogService);
  });

  it('UT-007 resolve(dismiss) marks the report resolved with no target mutation', async () => {
    findUniqueReport.mockResolvedValue(reportFixture());

    await service.resolve('admin-1', 'report-1', 'dismiss');

    expect(updateCommentRating).not.toHaveBeenCalled();
    expect(updateRecipe).not.toHaveBeenCalled();
    expect(updateReport).toHaveBeenCalledWith({
      where: { id: 'report-1' },
      data: { status: 'reviewed', reviewedByAdminId: 'admin-1' },
    });
    expect(auditLog).toHaveBeenCalledWith({
      adminId: 'admin-1',
      action: 'resolve',
      targetId: 'report-1',
    });
  });

  it('UT-008 resolve(hide_content) sets the target comment status to hidden', async () => {
    findUniqueReport.mockResolvedValue(
      reportFixture({ targetType: 'comment', targetId: 'comment-1' }),
    );

    await service.resolve('admin-1', 'report-1', 'hide_content');

    expect(updateCommentRating).toHaveBeenCalledWith({
      where: { id: 'comment-1' },
      data: { status: 'hidden' },
    });
    expect(updateReport).toHaveBeenCalled();
  });

  it('UT-009 resolve(reopen_recipe) sets the target recipe status to em_analise', async () => {
    findUniqueReport.mockResolvedValue(
      reportFixture({ targetType: 'recipe', targetId: 'recipe-1' }),
    );

    await service.resolve('admin-1', 'report-1', 'reopen_recipe');

    expect(updateRecipe).toHaveBeenCalledWith({
      where: { id: 'recipe-1' },
      data: { status: 'em_analise' },
    });
    expect(updateReport).toHaveBeenCalled();
  });

  it('resolve throws 404 for a nonexistent report', async () => {
    findUniqueReport.mockResolvedValue(null);

    await expect(
      service.resolve('admin-1', 'missing', 'dismiss'),
    ).rejects.toThrow(NotFoundException);
  });

  it('resolve(hide_content) rejects a recipe-targeted report', async () => {
    findUniqueReport.mockResolvedValue(
      reportFixture({ targetType: 'recipe', targetId: 'recipe-1' }),
    );

    await expect(
      service.resolve('admin-1', 'report-1', 'hide_content'),
    ).rejects.toThrow(BadRequestException);
  });

  it('resolve(reopen_recipe) rejects a comment-targeted report', async () => {
    findUniqueReport.mockResolvedValue(
      reportFixture({ targetType: 'comment', targetId: 'comment-1' }),
    );

    await expect(
      service.resolve('admin-1', 'report-1', 'reopen_recipe'),
    ).rejects.toThrow(BadRequestException);
  });
});
