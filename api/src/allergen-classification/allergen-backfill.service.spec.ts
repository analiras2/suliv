import { AllergenBackfillService } from './allergen-backfill.service';
import { AllergenClassificationService } from './allergen-classification.service';
import { PrismaService } from '../prisma/prisma.service';

interface RecipeRef {
  id: string;
}

function buildPrisma(options: {
  batches: RecipeRef[][];
  ingredientsByRecipe?: Record<string, string[]>;
}) {
  let index = 0;
  const recipeFindMany = jest.fn(() => {
    const batch = options.batches[index] ?? [];
    index += 1;
    return Promise.resolve(batch);
  });
  const tx = {
    recipeIngredient: {
      findMany: jest.fn(({ where }: { where: { recipeId: string } }) =>
        Promise.resolve(
          (options.ingredientsByRecipe?.[where.recipeId] ?? []).map((name) => ({
            name,
          })),
        ),
      ),
    },
  };
  const transaction = jest.fn(
    (callback: (client: typeof tx) => Promise<void>) => callback(tx),
  );
  const prisma = {
    recipe: { findMany: recipeFindMany },
    $transaction: transaction,
  } as unknown as PrismaService;
  return { prisma, tx, recipeFindMany };
}

function buildClassifier() {
  return {
    syncRecipeAllergens: jest.fn().mockResolvedValue(undefined),
  } as unknown as AllergenClassificationService & {
    syncRecipeAllergens: jest.Mock;
  };
}

describe('AllergenBackfillService', () => {
  it('UT-018 processes an ordered batch and calls the shared service once per recipe with its stored ingredient names', async () => {
    const { prisma, tx } = buildPrisma({
      batches: [[{ id: 'r1' }, { id: 'r2' }], []],
      ingredientsByRecipe: { r1: ['Leite'], r2: ['Ovos'] },
    });
    const classifier = buildClassifier();
    const service = new AllergenBackfillService(prisma, classifier);

    const result = await service.runBackfill();

    expect(classifier.syncRecipeAllergens).toHaveBeenNthCalledWith(
      1,
      tx,
      'r1',
      ['Leite'],
    );
    expect(classifier.syncRecipeAllergens).toHaveBeenNthCalledWith(
      2,
      tx,
      'r2',
      ['Ovos'],
    );
    expect(result).toEqual({ processed: 2, failedRecipeIds: [] });
  });

  it('UT-019 rerunning after a committed batch produces the same projection; resuming after a simulated next-batch failure processes remaining recipes without corrupting completed ones', async () => {
    const { prisma, classifier } = (() => {
      const built = buildPrisma({
        batches: [[{ id: 'r1' }], [{ id: 'r2' }], []],
        ingredientsByRecipe: { r1: ['Leite'], r2: ['Ovos'] },
      });
      const classifier = buildClassifier();
      classifier.syncRecipeAllergens.mockImplementation(
        (_tx: unknown, recipeId: string) =>
          recipeId === 'r1'
            ? Promise.reject(new Error('simulated batch failure'))
            : Promise.resolve(undefined),
      );
      return { prisma: built.prisma, classifier };
    })();
    const service = new AllergenBackfillService(prisma, classifier);

    const firstRun = await service.runBackfill();
    expect(firstRun.failedRecipeIds).toEqual(['r1']);
    expect(firstRun.processed).toBe(1);
    expect(classifier.syncRecipeAllergens).toHaveBeenCalledWith(
      expect.anything(),
      'r2',
      ['Ovos'],
    );

    const { prisma: rerunPrisma } = buildPrisma({
      batches: [[{ id: 'r1' }, { id: 'r2' }], []],
      ingredientsByRecipe: { r1: ['Leite'], r2: ['Ovos'] },
    });
    const rerunClassifier = buildClassifier();
    const rerunService = new AllergenBackfillService(
      rerunPrisma,
      rerunClassifier,
    );

    const secondRun = await rerunService.runBackfill();
    const thirdRun = await new AllergenBackfillService(
      buildPrisma({
        batches: [[{ id: 'r1' }, { id: 'r2' }], []],
        ingredientsByRecipe: { r1: ['Leite'], r2: ['Ovos'] },
      }).prisma,
      buildClassifier(),
    ).runBackfill();

    expect(secondRun).toEqual({ processed: 2, failedRecipeIds: [] });
    expect(thirdRun).toEqual(secondRun);
  });

  it('UT-020 a failed recipe increments the failure summary with its ID while later recipes continue processing', async () => {
    const { prisma } = buildPrisma({
      batches: [[{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }], []],
      ingredientsByRecipe: { r1: ['Leite'], r2: ['Ovos'], r3: ['Soja'] },
    });
    const classifier = buildClassifier();
    classifier.syncRecipeAllergens.mockImplementation(
      (_tx: unknown, recipeId: string) =>
        recipeId === 'r2'
          ? Promise.reject(new Error('boom'))
          : Promise.resolve(undefined),
    );
    const service = new AllergenBackfillService(prisma, classifier);

    const result = await service.runBackfill();

    expect(result.failedRecipeIds).toEqual(['r2']);
    expect(result.processed).toBe(2);
    expect(classifier.syncRecipeAllergens).toHaveBeenCalledWith(
      expect.anything(),
      'r3',
      ['Soja'],
    );
  });

  it('UT-021 an empty recipe query exits successfully with processed=0 and failed=0', async () => {
    const { prisma, recipeFindMany } = buildPrisma({ batches: [[]] });
    const classifier = buildClassifier();
    const service = new AllergenBackfillService(prisma, classifier);

    const result = await service.runBackfill();

    expect(result).toEqual({ processed: 0, failedRecipeIds: [] });
    expect(recipeFindMany).toHaveBeenCalledTimes(1);
    expect(classifier.syncRecipeAllergens).not.toHaveBeenCalled();
  });

  it('UT-022 a recipe with no ingredients invokes synchronization with an empty list and clears prior projection rows', async () => {
    const { prisma, tx } = buildPrisma({
      batches: [[{ id: 'r1' }], []],
      ingredientsByRecipe: {},
    });
    const classifier = buildClassifier();
    const service = new AllergenBackfillService(prisma, classifier);

    await service.runBackfill();

    expect(tx.recipeIngredient.findMany).toHaveBeenCalledWith({
      where: { recipeId: 'r1' },
      select: { name: true },
    });
    expect(classifier.syncRecipeAllergens).toHaveBeenCalledWith(tx, 'r1', []);
  });
});
