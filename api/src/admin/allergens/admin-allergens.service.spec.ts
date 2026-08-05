import { ConflictException, NotFoundException } from '@nestjs/common';
import { Allergen } from '@prisma/client';
import { AuditLogService } from '../audit-log.service';
import { AdminAllergensService } from './admin-allergens.service';

function allergenFixture(overrides: Partial<Allergen> = {}): Allergen {
  return {
    id: 'allergen-1',
    name: 'Amendoim',
    status: 'pending',
    reviewedByAdminId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AdminAllergensService', () => {
  const findMany = jest.fn();
  const findUnique = jest.fn();
  const update = jest.fn();
  const deleteAllergen = jest.fn();
  const prisma = {
    allergen: {
      findMany,
      findUnique,
      update,
      delete: deleteAllergen,
    },
  };
  const auditLog = jest.fn();
  const auditLogService = { log: auditLog } as unknown as AuditLogService;

  let service: AdminAllergensService;

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new AdminAllergensService(prisma as any, auditLogService);
  });

  it('listPending returns pending allergens ordered by createdAt asc', async () => {
    const fixture = allergenFixture();
    findMany.mockResolvedValue([fixture]);

    const result = await service.listPending();

    expect(findMany).toHaveBeenCalledWith({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });
    expect(result).toEqual([fixture]);
  });

  it('UT-010 approve for a pending allergen sets status: approved, reviewedByAdminId', async () => {
    findUnique.mockResolvedValue(allergenFixture());

    await service.approve('admin-1', 'allergen-1');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'allergen-1' },
      data: { status: 'approved', reviewedByAdminId: 'admin-1' },
    });
    expect(auditLog).toHaveBeenCalledWith({
      adminId: 'admin-1',
      action: 'allergen-approve',
      targetId: 'allergen-1',
    });
  });

  it('approve throws NotFoundException for a nonexistent allergen', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.approve('admin-1', 'missing')).rejects.toThrow(
      NotFoundException,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('UT-011 reject for a pending allergen: the row no longer exists afterward', async () => {
    findUnique.mockResolvedValue(allergenFixture({ status: 'pending' }));

    await service.reject('admin-1', 'allergen-1');

    expect(deleteAllergen).toHaveBeenCalledWith({
      where: { id: 'allergen-1' },
    });
    expect(auditLog).toHaveBeenCalledWith({
      adminId: 'admin-1',
      action: 'allergen-reject',
      targetId: 'allergen-1',
    });
  });

  it('UT-012 reject for an already-approved allergen rejects with 409-equivalent, row untouched', async () => {
    findUnique.mockResolvedValue(allergenFixture({ status: 'approved' }));

    await expect(service.reject('admin-1', 'allergen-1')).rejects.toThrow(
      ConflictException,
    );
    expect(deleteAllergen).not.toHaveBeenCalled();
    expect(auditLog).not.toHaveBeenCalled();
  });

  it('reject throws NotFoundException for a nonexistent allergen', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.reject('admin-1', 'missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
