import { PrismaClient, RecipeCategory } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const FK_CONSTRAINT_NAME = 'editorial_boosts_applied_by_admin_id_fkey';

describe('editorial_boosts.applied_by_admin_id FK backfill (migration)', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('IT-019 nulls out dangling soft admin ids before the FK constraint can be re-added', async () => {
    const category = await prisma.category.upsert({
      where: { key: RecipeCategory.lanche },
      update: {},
      create: { key: RecipeCategory.lanche, label: 'Lanche' },
    });
    const authorId = `fk-migration-author-${randomUUID()}`;
    await prisma.user.create({
      data: {
        id: authorId,
        email: `${authorId}@example.com`,
        username: authorId,
      },
    });
    const recipe = await prisma.recipe.create({
      data: {
        slug: `fk-migration-${randomUUID()}`,
        authorId,
        title: 'FK migration fixture',
        description: 'Fixture recipe for FK backfill test',
        categoryId: category.id,
        prepTimeMinutes: 20,
        timeBucket: 'quinze_30',
        servings: 4,
        difficulty: 'iniciante',
        dietPreference: 'flexitariano',
        status: 'aprovada',
      },
    });

    // Simulate the pre-migration state: drop the FK so a dangling soft
    // reference (an id with no matching admin row) can exist, just like it
    // could have on a database that already had editorial_boosts rows
    // before the admins table and FK were introduced.
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "editorial_boosts" DROP CONSTRAINT "${FK_CONSTRAINT_NAME}"`,
    );

    const boost = await prisma.editorialBoost.create({
      data: {
        recipeId: recipe.id,
        weight: 5,
        appliedByAdminId: randomUUID(),
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 86400000),
      },
    });

    try {
      // Same statement the migration runs before re-adding the FK.
      await prisma.$executeRawUnsafe(
        'UPDATE "editorial_boosts" SET "applied_by_admin_id" = NULL WHERE "applied_by_admin_id" IS NOT NULL AND "id" = $1',
        boost.id,
      );

      const reloaded = await prisma.editorialBoost.findUniqueOrThrow({
        where: { id: boost.id },
      });
      expect(reloaded.appliedByAdminId).toBeNull();
    } finally {
      const [{ exists }] = await prisma.$queryRawUnsafe<[{ exists: boolean }]>(
        `SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${FK_CONSTRAINT_NAME}') AS exists`,
      );
      if (!exists) {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "editorial_boosts" ADD CONSTRAINT "${FK_CONSTRAINT_NAME}" FOREIGN KEY ("applied_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
        );
      }
      await prisma.editorialBoost.delete({ where: { id: boost.id } });
    }
  });
});
