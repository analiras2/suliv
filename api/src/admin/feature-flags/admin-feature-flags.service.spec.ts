import { NotFoundException } from '@nestjs/common';
import { FeatureFlag } from '@prisma/client';
import { AuditLogService } from '../audit-log.service';
import { AdminFeatureFlagsService } from './admin-feature-flags.service';

function flagFixture(overrides: Partial<FeatureFlag> = {}): FeatureFlag {
  return {
    id: 'flag-1',
    key: 'new_search',
    enabled: true,
    rolloutPercentage: 50,
    ...overrides,
  };
}

describe('AdminFeatureFlagsService', () => {
  const findUnique = jest.fn();
  const findMany = jest.fn();
  const update = jest.fn();
  const prisma = {
    featureFlag: { findUnique, findMany, update },
  };
  const auditLog = jest.fn();
  const auditLogService = { log: auditLog } as unknown as AuditLogService;

  let service: AdminFeatureFlagsService;

  beforeEach(() => {
    jest.clearAllMocks();
    findUnique.mockResolvedValue(flagFixture());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new AdminFeatureFlagsService(prisma as any, auditLogService);
  });

  it('listAll returns every flag sorted by key', async () => {
    findMany.mockResolvedValue([flagFixture()]);

    const result = await service.listAll();

    expect(findMany).toHaveBeenCalledWith({ orderBy: { key: 'asc' } });
    expect(result).toEqual([flagFixture()]);
  });

  it('UT-016 updating only enabled calls update with exactly the changed field', async () => {
    update.mockResolvedValue(flagFixture({ enabled: false }));

    await service.update('admin-1', 'new_search', { enabled: false });

    expect(update).toHaveBeenCalledWith({
      where: { key: 'new_search' },
      data: { enabled: false },
    });
    expect(auditLog).toHaveBeenCalledWith({
      adminId: 'admin-1',
      action: 'feature-flag-update',
      targetId: 'new_search',
    });
  });

  it('UT-016 updating only rolloutPercentage calls update with exactly the changed field', async () => {
    update.mockResolvedValue(flagFixture({ rolloutPercentage: 75 }));

    await service.update('admin-1', 'new_search', { rolloutPercentage: 75 });

    expect(update).toHaveBeenCalledWith({
      where: { key: 'new_search' },
      data: { rolloutPercentage: 75 },
    });
  });

  it('update throws NotFoundException for an unknown key', async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      service.update('admin-1', 'missing_flag', { enabled: false }),
    ).rejects.toThrow(NotFoundException);
    expect(update).not.toHaveBeenCalled();
  });
});
