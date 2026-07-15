import { PrismaClient } from '@prisma/client';

const APPROVED_ALLERGENS = [
  'Leite',
  'Ovos',
  'Trigo (Glúten)',
  'Amendoim',
  'Castanhas e Nozes',
  'Soja',
  'Gergelim',
];

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    for (const name of APPROVED_ALLERGENS) {
      await prisma.allergen.upsert({
        where: { name },
        update: { status: 'approved' },
        create: { name, status: 'approved' },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
