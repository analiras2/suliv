import { BadRequestException } from '@nestjs/common';
import { EditorialBoost } from '@prisma/client';
import { AuditLogService } from '../audit-log.service';
import { AdminBoostsService } from './admin-boosts.service';

function boostFixture(overrides: Partial<EditorialBoost> = {}): EditorialBoost {
  return {
    id: 'boost-1',
    recipeId: 'recipe-1',
    weight: 10,
    appliedByAdminId: 'admin-1',
    startsAt: new Date('2026-01-01'),
    endsAt: new Date('2026-01-10'),
    ...overrides,
  };
}

describe('AdminBoostsService', () => {
  const findMany = jest.fn();
  const create = jest.fn();
  const prisma = {
    editorialBoost: { findMany, create },
  };
  const auditLog = jest.fn();
  const auditLogService = { log: auditLog } as unknown as AuditLogService;

  let service: AdminBoostsService;

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new AdminBoostsService(prisma as any, auditLogService);
  });

  it('UT-015 list returns boosts sorted by startsAt descending', async () => {
    findMany.mockResolvedValue([boostFixture()]);

    const result = await service.list();

    expect(findMany).toHaveBeenCalledWith({ orderBy: { startsAt: 'desc' } });
    expect(result).toEqual([boostFixture()]);
  });

  it('UT-013 create with endsAt > startsAt creates the row', async () => {
    const startsAt = new Date('2026-02-01');
    const endsAt = new Date('2026-02-10');
    create.mockResolvedValue(boostFixture({ startsAt, endsAt }));

    const result = await service.create(
      'admin-1',
      'recipe-1',
      10,
      startsAt,
      endsAt,
    );

    expect(create).toHaveBeenCalledWith({
      data: {
        recipeId: 'recipe-1',
        weight: 10,
        startsAt,
        endsAt,
        appliedByAdminId: 'admin-1',
      },
    });
    expect(auditLog).toHaveBeenCalledWith({
      adminId: 'admin-1',
      action: 'boost-create',
      targetId: result.id,
    });
  });

  it('UT-014 create with endsAt <= startsAt rejects before any database write', async () => {
    const startsAt = new Date('2026-02-10');
    const endsAt = new Date('2026-02-01');

    await expect(
      service.create('admin-1', 'recipe-1', 10, startsAt, endsAt),
    ).rejects.toThrow(BadRequestException);
    expect(create).not.toHaveBeenCalled();
    expect(auditLog).not.toHaveBeenCalled();
  });

  it('create rejects when endsAt equals startsAt', async () => {
    const sameDate = new Date('2026-02-10');

    await expect(
      service.create('admin-1', 'recipe-1', 10, sameDate, sameDate),
    ).rejects.toThrow(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });
});
