import { Prisma } from '@prisma/client';
import { AllergenClassificationService } from './allergen-classification.service';

function txFixture() {
  const findMany = jest.fn();
  const deleteMany = jest.fn();
  const createMany = jest.fn();
  const tx = {
    allergenIngredientTerm: { findMany },
    recipeAllergen: { deleteMany, createMany },
  } as unknown as Prisma.TransactionClient;
  return { tx, findMany, deleteMany, createMany };
}

describe('AllergenClassificationService', () => {
  let service: AllergenClassificationService;

  beforeEach(() => {
    service = new AllergenClassificationService();
  });

  describe('normalizeIngredientName', () => {
    it('UT-001 collapses whitespace/case and produces equivalent output for padded/upper input', () => {
      expect(service.normalizeIngredientName('  LEITE   INTEGRAL  ')).toBe(
        service.normalizeIngredientName('leite integral'),
      );
      expect(service.normalizeIngredientName('  LEITE   INTEGRAL  ')).toBe(
        'leite integral',
      );
    });

    it('UT-001 normalizes accented input equivalently to its unaccented form', () => {
      expect(service.normalizeIngredientName('Amêndoas')).toBe(
        service.normalizeIngredientName('Amendoas'),
      );
      expect(service.normalizeIngredientName('Parmesão ralado')).toBe(
        'parmesao ralado',
      );
    });

    it('UT-009 treats equivalent punctuation as non-distinguishing', () => {
      expect(service.normalizeIngredientName('Leite,')).toBe(
        service.normalizeIngredientName('Leite'),
      );
      expect(service.normalizeIngredientName('Leite-soja')).toBe(
        service.normalizeIngredientName('Leite soja'),
      );
      expect(service.normalizeIngredientName('leite (integral)')).toBe(
        'leite integral',
      );
    });

    it('UT-010 normalizes punctuation-only input to an empty, non-matching string', () => {
      expect(service.normalizeIngredientName('...')).toBe('');
      expect(service.normalizeIngredientName('-')).toBe('');
    });
  });

  describe('detectAllergenIds', () => {
    it('UT-002 a catalog term "leite" does not detect "leite de coco"', async () => {
      const { tx, findMany } = txFixture();
      findMany.mockResolvedValue([]);

      const result = await service.detectAllergenIds(tx, ['Leite de coco']);

      expect(findMany).toHaveBeenCalledWith({
        where: {
          normalizedTerm: { in: ['leite de coco'] },
          allergen: { status: 'approved' },
        },
        select: { allergenId: true },
      });
      expect(result).toEqual([]);
    });

    it('UT-002 detection succeeds once "leite de coco" is separately cataloged', async () => {
      const { tx, findMany } = txFixture();
      findMany.mockResolvedValue([{ allergenId: 'milk-id' }]);

      const result = await service.detectAllergenIds(tx, ['Leite de coco']);

      expect(result).toEqual(['milk-id']);
    });

    it('UT-007 two names mapping to the same allergen are deduplicated into one id', async () => {
      const { tx, findMany } = txFixture();
      findMany.mockResolvedValue([
        { allergenId: 'milk-id' },
        { allergenId: 'milk-id' },
      ]);

      const result = await service.detectAllergenIds(tx, [
        'Leite',
        'Leite integral',
      ]);

      expect(result).toEqual(['milk-id']);
    });

    it('UT-011 a catalog term "leite" matches an ingredient written as "Leite,"', async () => {
      const { tx, findMany } = txFixture();
      findMany.mockResolvedValue([{ allergenId: 'milk-id' }]);

      const result = await service.detectAllergenIds(tx, ['Leite,']);

      expect(findMany).toHaveBeenCalledWith({
        where: {
          normalizedTerm: { in: ['leite'] },
          allergen: { status: 'approved' },
        },
        select: { allergenId: true },
      });
      expect(result).toEqual(['milk-id']);
    });

    it('UT-012 punctuation-only ingredient names are filtered out before lookup', async () => {
      const { tx, findMany } = txFixture();
      findMany.mockResolvedValue([]);

      const result = await service.detectAllergenIds(tx, ['...', '-']);

      expect(findMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('syncRecipeAllergens', () => {
    it('UT-004 creates exactly the links for matched Milk and Egg terms without touching unrelated data', async () => {
      const { tx, findMany, deleteMany, createMany } = txFixture();
      findMany.mockResolvedValue([
        { allergenId: 'milk-id' },
        { allergenId: 'egg-id' },
      ]);

      await service.syncRecipeAllergens(tx, 'recipe-1', ['Leite', 'Ovos']);

      expect(deleteMany).toHaveBeenCalledWith({
        where: { recipeId: 'recipe-1' },
      });
      expect(createMany).toHaveBeenCalledWith({
        data: [
          { recipeId: 'recipe-1', allergenId: 'milk-id' },
          { recipeId: 'recipe-1', allergenId: 'egg-id' },
        ],
        skipDuplicates: true,
      });
    });

    it('UT-005 replacing the name list deletes the stale Milk link and leaves only the new Soy link', async () => {
      const { tx, findMany, deleteMany, createMany } = txFixture();
      findMany.mockResolvedValue([{ allergenId: 'soy-id' }]);

      await service.syncRecipeAllergens(tx, 'recipe-1', ['Leite de soja']);

      expect(deleteMany).toHaveBeenCalledWith({
        where: { recipeId: 'recipe-1' },
      });
      expect(createMany).toHaveBeenCalledWith({
        data: [{ recipeId: 'recipe-1', allergenId: 'soy-id' }],
        skipDuplicates: true,
      });
    });

    it('UT-006 an unmatched list replaces the projection with an empty set without throwing', async () => {
      const { tx, findMany, deleteMany, createMany } = txFixture();
      findMany.mockResolvedValue([]);

      await expect(
        service.syncRecipeAllergens(tx, 'recipe-1', ['Alface']),
      ).resolves.toBeUndefined();

      expect(deleteMany).toHaveBeenCalledWith({
        where: { recipeId: 'recipe-1' },
      });
      expect(createMany).not.toHaveBeenCalled();
    });

    it('UT-007 two names mapping to Milk produce one recipeAllergen.createMany value for Milk', async () => {
      const { tx, findMany, createMany } = txFixture();
      findMany.mockResolvedValue([
        { allergenId: 'milk-id' },
        { allergenId: 'milk-id' },
      ]);

      await service.syncRecipeAllergens(tx, 'recipe-1', [
        'Leite',
        'Leite integral',
      ]);

      expect(createMany).toHaveBeenCalledWith({
        data: [{ recipeId: 'recipe-1', allergenId: 'milk-id' }],
        skipDuplicates: true,
      });
    });

    it('UT-008 replaying synchronization with the same recipe and names is idempotent', async () => {
      const { tx, findMany, deleteMany, createMany } = txFixture();
      findMany.mockResolvedValue([{ allergenId: 'milk-id' }]);

      await service.syncRecipeAllergens(tx, 'recipe-1', ['Leite']);
      await service.syncRecipeAllergens(tx, 'recipe-1', ['Leite']);

      expect(deleteMany).toHaveBeenCalledTimes(2);
      expect(createMany).toHaveBeenNthCalledWith(1, {
        data: [{ recipeId: 'recipe-1', allergenId: 'milk-id' }],
        skipDuplicates: true,
      });
      expect(createMany).toHaveBeenNthCalledWith(2, {
        data: [{ recipeId: 'recipe-1', allergenId: 'milk-id' }],
        skipDuplicates: true,
      });
    });

    it('UT-013 an empty projection carries no detected conflict metadata and the service exposes no safe/medical-clearance signal', async () => {
      const { tx, findMany, deleteMany, createMany } = txFixture();
      findMany.mockResolvedValue([]);

      const detected = await service.detectAllergenIds(tx, ['Alface']);
      await service.syncRecipeAllergens(tx, 'recipe-1', ['Alface']);

      expect(detected).toEqual([]);
      expect(deleteMany).toHaveBeenCalledWith({
        where: { recipeId: 'recipe-1' },
      });
      expect(createMany).not.toHaveBeenCalled();
      expect(
        (service as unknown as Record<string, unknown>).safe,
      ).toBeUndefined();
      expect(
        (service as unknown as Record<string, unknown>).isSafeForUser,
      ).toBeUndefined();
      expect(
        (service as unknown as Record<string, unknown>).medicalClearance,
      ).toBeUndefined();
    });
  });
});
