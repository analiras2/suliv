import {
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Report } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from './reports.service';

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

function duplicateReportError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    clientVersion: 'test',
    code: 'P2002',
    meta: { target: ['reporter_user_id', 'target_type', 'target_id'] },
  });
}

describe('ReportsService', () => {
  const createReport = jest.fn();
  const countReport = jest.fn();
  const findUniqueRecipe = jest.fn();
  const findUniqueCommentRating = jest.fn();
  const prisma = {
    report: { create: createReport, count: countReport },
    recipe: { findUnique: findUniqueRecipe },
    commentRating: { findUnique: findUniqueCommentRating },
  };
  let service: ReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    countReport.mockResolvedValue(0);
    findUniqueCommentRating.mockResolvedValue({ id: 'comment-1' });
    findUniqueRecipe.mockResolvedValue({ id: 'recipe-1' });
    service = new ReportsService(prisma as unknown as PrismaService);
  });

  it('UT-009 creates a pending report against an existing comment', async () => {
    const created = reportFixture();
    createReport.mockResolvedValue(created);

    const result = await service.create('user-1', {
      targetType: 'comment',
      targetId: 'comment-1',
      reason: 'spam',
    });

    expect(result).toBe(created);
    expect(createReport).toHaveBeenCalledWith({
      data: {
        reporterUserId: 'user-1',
        targetType: 'comment',
        targetId: 'comment-1',
        reason: 'spam',
        freeText: undefined,
      },
    });
  });

  it('UT-010 throws 404 and creates nothing when the target does not exist', async () => {
    findUniqueCommentRating.mockResolvedValue(null);

    await expect(
      service.create('user-1', {
        targetType: 'comment',
        targetId: 'nonexistent-id',
        reason: 'spam',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(createReport).not.toHaveBeenCalled();
  });

  it('UT-011 throws 409 on a duplicate (reporter, target) report', async () => {
    createReport.mockRejectedValue(duplicateReportError());

    await expect(
      service.create('user-1', {
        targetType: 'comment',
        targetId: 'comment-1',
        reason: 'spam',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('UT-012 rejects with 429 on the 11th report in the same day', async () => {
    countReport.mockResolvedValue(10);

    await expect(
      service.create('user-1', {
        targetType: 'comment',
        targetId: 'comment-1',
        reason: 'spam',
      }),
    ).rejects.toThrow(HttpException);
    expect(createReport).not.toHaveBeenCalled();
  });
});
