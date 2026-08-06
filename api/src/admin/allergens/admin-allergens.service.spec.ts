import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Allergen, AllergenIngredientTerm, Prisma } from '@prisma/client';
import { AllergenClassificationService } from '../../allergen-classification/allergen-classification.service';
import { PrismaService } from '../../prisma/prisma.service';
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

function termFixture(
  overrides: Partial<AllergenIngredientTerm> = {},
): AllergenIngredientTerm {
  return {
    id: 'term-1',
    allergenId: 'allergen-1',
    term: 'Leite integral',
    normalizedTerm: 'leite integral',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function uniqueConstraintError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

describe('AdminAllergensService', () => {
  const findManyAllergen = jest.fn();
  const findUniqueAllergen = jest.fn();
  const update = jest.fn();
  const deleteAllergen = jest.fn();
  const findFirstTerm = jest.fn();
  const createTerm = jest.fn();
  const updateTerm = jest.fn();
  const deleteTerm = jest.fn();
  const prisma = {
    allergen: {
      findMany: findManyAllergen,
      findUnique: findUniqueAllergen,
      update,
      delete: deleteAllergen,
    },
    allergenIngredientTerm: {
      findFirst: findFirstTerm,
      create: createTerm,
      update: updateTerm,
      delete: deleteTerm,
    },
  };
  const auditLog = jest.fn();
  const auditLogService = { log: auditLog } as unknown as AuditLogService;
  const normalizeIngredientName = jest.fn((value: string) =>
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' '),
  );
  const classificationService = {
    normalizeIngredientName,
  } as unknown as AllergenClassificationService;

  let service: AdminAllergensService;

  beforeEach(() => {
    jest.clearAllMocks();
    normalizeIngredientName.mockImplementation((value: string) =>
      value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' '),
    );

    service = new AdminAllergensService(
      prisma as unknown as PrismaService,
      auditLogService,
      classificationService,
    );
  });

  it('listPending returns pending allergens ordered by createdAt asc', async () => {
    const fixture = allergenFixture();
    findManyAllergen.mockResolvedValue([fixture]);

    const result = await service.listPending();

    expect(findManyAllergen).toHaveBeenCalledWith({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });
    expect(result).toEqual([fixture]);
  });

  it('listApproved returns approved allergens with their ingredient terms', async () => {
    const fixture = allergenFixture({ status: 'approved' });
    findManyAllergen.mockResolvedValue([fixture]);

    const result = await service.listApproved();

    expect(findManyAllergen).toHaveBeenCalledWith({
      where: { status: 'approved' },
      orderBy: { name: 'asc' },
      include: { ingredientTerms: { orderBy: { term: 'asc' } } },
    });
    expect(result).toEqual([fixture]);
  });

  it('UT-010 approve for a pending allergen sets status: approved, reviewedByAdminId', async () => {
    findUniqueAllergen.mockResolvedValue(allergenFixture());

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
    findUniqueAllergen.mockResolvedValue(null);

    await expect(service.approve('admin-1', 'missing')).rejects.toThrow(
      NotFoundException,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('UT-011 reject for a pending allergen: the row no longer exists afterward', async () => {
    findUniqueAllergen.mockResolvedValue(
      allergenFixture({ status: 'pending' }),
    );

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
    findUniqueAllergen.mockResolvedValue(
      allergenFixture({ status: 'approved' }),
    );

    await expect(service.reject('admin-1', 'allergen-1')).rejects.toThrow(
      ConflictException,
    );
    expect(deleteAllergen).not.toHaveBeenCalled();
    expect(auditLog).not.toHaveBeenCalled();
  });

  it('reject throws NotFoundException for a nonexistent allergen', async () => {
    findUniqueAllergen.mockResolvedValue(null);

    await expect(service.reject('admin-1', 'missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('term management', () => {
    it('UT-014 create then update a term for an approved allergen persists normalized data and audits both actions', async () => {
      findUniqueAllergen.mockResolvedValue(
        allergenFixture({ status: 'approved' }),
      );
      const created = termFixture();
      createTerm.mockResolvedValue(created);

      const createResult = await service.createTerm(
        'admin-1',
        'allergen-1',
        '  Leite Integral  ',
      );

      expect(createTerm).toHaveBeenCalledWith({
        data: {
          allergenId: 'allergen-1',
          term: 'Leite Integral',
          normalizedTerm: 'leite integral',
        },
      });
      expect(auditLog).toHaveBeenCalledWith({
        adminId: 'admin-1',
        action: 'allergen-term-create',
        targetId: created.id,
      });
      expect(createResult).toEqual({
        id: created.id,
        allergenId: created.allergenId,
        term: created.term,
      });

      findFirstTerm.mockResolvedValue(created);
      const updated = termFixture({
        term: 'Leite Desnatado',
        normalizedTerm: 'leite desnatado',
      });
      updateTerm.mockResolvedValue(updated);

      const updateResult = await service.updateTerm(
        'admin-1',
        'allergen-1',
        created.id,
        'Leite Desnatado',
      );

      expect(updateTerm).toHaveBeenCalledWith({
        where: { id: created.id },
        data: { term: 'Leite Desnatado', normalizedTerm: 'leite desnatado' },
      });
      expect(auditLog).toHaveBeenCalledWith({
        adminId: 'admin-1',
        action: 'allergen-term-update',
        targetId: updated.id,
      });
      expect(updateResult).toEqual({
        id: updated.id,
        allergenId: updated.allergenId,
        term: updated.term,
      });
    });

    it('UT-015 create rejects a pending allergen with 422 and writes no term or audit entry', async () => {
      findUniqueAllergen.mockResolvedValue(
        allergenFixture({ status: 'pending' }),
      );

      await expect(
        service.createTerm('admin-1', 'allergen-1', 'Leite integral'),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(createTerm).not.toHaveBeenCalled();
      expect(auditLog).not.toHaveBeenCalled();
    });

    it('UT-015 create rejects a nonexistent allergen with 404 and writes no term or audit entry', async () => {
      findUniqueAllergen.mockResolvedValue(null);

      await expect(
        service.createTerm('admin-1', 'missing', 'Leite integral'),
      ).rejects.toThrow(NotFoundException);
      expect(createTerm).not.toHaveBeenCalled();
      expect(auditLog).not.toHaveBeenCalled();
    });

    it('UT-016 duplicate normalized terms for the same allergen surface a conflict', async () => {
      findUniqueAllergen.mockResolvedValue(
        allergenFixture({ status: 'approved' }),
      );
      createTerm.mockRejectedValue(uniqueConstraintError());

      await expect(
        service.createTerm('admin-1', 'allergen-1', 'Leite integral'),
      ).rejects.toThrow(ConflictException);
      expect(auditLog).not.toHaveBeenCalled();
    });

    it('UT-003 create rejects a blank/punctuation-only term with 400 and writes nothing', async () => {
      findUniqueAllergen.mockResolvedValue(
        allergenFixture({ status: 'approved' }),
      );

      await expect(
        service.createTerm('admin-1', 'allergen-1', '!!! ,,,'),
      ).rejects.toThrow(BadRequestException);
      expect(createTerm).not.toHaveBeenCalled();
      expect(auditLog).not.toHaveBeenCalled();
    });

    it('UT-017 deleting a term removes only the catalog rule, leaving prior recipe projections untouched', async () => {
      const existing = termFixture();
      findFirstTerm.mockResolvedValue(existing);

      await service.deleteTerm('admin-1', 'allergen-1', existing.id);

      expect(deleteTerm).toHaveBeenCalledWith({ where: { id: existing.id } });
      expect(auditLog).toHaveBeenCalledWith({
        adminId: 'admin-1',
        action: 'allergen-term-delete',
        targetId: existing.id,
      });
    });

    it('deleteTerm throws NotFoundException when the term is not scoped to the allergen', async () => {
      findFirstTerm.mockResolvedValue(null);

      await expect(
        service.deleteTerm('admin-1', 'allergen-1', 'missing-term'),
      ).rejects.toThrow(NotFoundException);
      expect(deleteTerm).not.toHaveBeenCalled();
      expect(auditLog).not.toHaveBeenCalled();
    });
  });
});
