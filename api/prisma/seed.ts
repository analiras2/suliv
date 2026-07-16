import { DietPreference, CookingLevel, PrismaClient, RecipeCategory, TimeBucket } from '@prisma/client';

const APPROVED_ALLERGENS = [
  'Leite',
  'Ovos',
  'Trigo (Glúten)',
  'Amendoim',
  'Castanhas e Nozes',
  'Soja',
  'Gergelim',
];

const CATEGORIES: { key: RecipeCategory; label: string }[] = [
  { key: 'cafe_da_manha', label: 'Café da manhã' },
  { key: 'almoco_jantar', label: 'Almoço/Jantar' },
  { key: 'lanche', label: 'Lanche' },
  { key: 'sobremesa', label: 'Sobremesa' },
  { key: 'bebida', label: 'Bebida' },
  { key: 'molhos_acompanhamentos', label: 'Molhos/Acompanhamentos' },
];

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288',
  'https://images.unsplash.com/photo-1512058564366-18510be2db19',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352',
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352',
];

interface RecipeSeed {
  slug: string;
  title: string;
  description: string;
  categoryKey: RecipeCategory;
  prepTimeMinutes: number;
  timeBucket: TimeBucket;
  servings: number;
  difficulty: CookingLevel;
  dietPreference: DietPreference;
  coverImageUrl: string;
  weeklyOpens: number;
  weeklyFavoritesAdded: number;
  weeklyCookCompletions: number;
}

const RECIPES: RecipeSeed[] = [
  {
    slug: 'panqueca-de-banana-vegana',
    title: 'Panqueca de banana vegana',
    description: 'Panquecas fofinhas feitas com banana amassada e aveia, sem leite nem ovos.',
    categoryKey: 'cafe_da_manha',
    prepTimeMinutes: 15,
    timeBucket: 'ate_15',
    servings: 2,
    difficulty: 'iniciante',
    dietPreference: 'vegano',
    coverImageUrl: PLACEHOLDER_IMAGES[0],
    weeklyOpens: 420,
    weeklyFavoritesAdded: 58,
    weeklyCookCompletions: 31,
  },
  {
    slug: 'omelete-de-espinafre',
    title: 'Omelete de espinafre',
    description: 'Omelete simples com espinafre refogado e queijo, pronto em poucos minutos.',
    categoryKey: 'cafe_da_manha',
    prepTimeMinutes: 10,
    timeBucket: 'ate_15',
    servings: 1,
    difficulty: 'iniciante',
    dietPreference: 'vegetariano',
    coverImageUrl: PLACEHOLDER_IMAGES[1],
    weeklyOpens: 210,
    weeklyFavoritesAdded: 19,
    weeklyCookCompletions: 12,
  },
  {
    slug: 'granola-caseira-com-frutas',
    title: 'Granola caseira com frutas',
    description: 'Granola assada com aveia, castanhas e mel, servida com frutas frescas.',
    categoryKey: 'cafe_da_manha',
    prepTimeMinutes: 35,
    timeBucket: 'trinta_60',
    servings: 6,
    difficulty: 'intermediario',
    dietPreference: 'flexitariano',
    coverImageUrl: PLACEHOLDER_IMAGES[2],
    weeklyOpens: 150,
    weeklyFavoritesAdded: 22,
    weeklyCookCompletions: 8,
  },
  {
    slug: 'strogonoff-de-grao-de-bico',
    title: 'Strogonoff de grão-de-bico',
    description: 'Versão vegana do clássico strogonoff, com grão-de-bico e creme de castanha.',
    categoryKey: 'almoco_jantar',
    prepTimeMinutes: 40,
    timeBucket: 'trinta_60',
    servings: 4,
    difficulty: 'intermediario',
    dietPreference: 'vegano',
    coverImageUrl: PLACEHOLDER_IMAGES[3],
    weeklyOpens: 610,
    weeklyFavoritesAdded: 94,
    weeklyCookCompletions: 47,
  },
  {
    slug: 'risoto-de-cogumelos',
    title: 'Risoto de cogumelos',
    description: 'Risoto cremoso com mix de cogumelos frescos e parmesão.',
    categoryKey: 'almoco_jantar',
    prepTimeMinutes: 50,
    timeBucket: 'trinta_60',
    servings: 3,
    difficulty: 'avancado',
    dietPreference: 'vegetariano',
    coverImageUrl: PLACEHOLDER_IMAGES[4],
    weeklyOpens: 340,
    weeklyFavoritesAdded: 41,
    weeklyCookCompletions: 15,
  },
  {
    slug: 'frango-grelhado-com-legumes',
    title: 'Frango grelhado com legumes',
    description: 'Peito de frango grelhado servido com legumes salteados na manteiga.',
    categoryKey: 'almoco_jantar',
    prepTimeMinutes: 30,
    timeBucket: 'quinze_30',
    servings: 2,
    difficulty: 'iniciante',
    dietPreference: 'flexitariano',
    coverImageUrl: PLACEHOLDER_IMAGES[5],
    weeklyOpens: 500,
    weeklyFavoritesAdded: 63,
    weeklyCookCompletions: 39,
  },
  {
    slug: 'feijoada-simplificada',
    title: 'Feijoada simplificada',
    description: 'Versão rápida da feijoada tradicional, pronta em uma hora.',
    categoryKey: 'almoco_jantar',
    prepTimeMinutes: 75,
    timeBucket: 'sessenta_mais',
    servings: 6,
    difficulty: 'avancado',
    dietPreference: 'flexitariano',
    coverImageUrl: PLACEHOLDER_IMAGES[0],
    weeklyOpens: 280,
    weeklyFavoritesAdded: 35,
    weeklyCookCompletions: 11,
  },
  {
    slug: 'wrap-de-grao-de-bico',
    title: 'Wrap de grão-de-bico',
    description: 'Wrap recheado com pasta de grão-de-bico temperada e vegetais crocantes.',
    categoryKey: 'lanche',
    prepTimeMinutes: 12,
    timeBucket: 'ate_15',
    servings: 1,
    difficulty: 'iniciante',
    dietPreference: 'vegano',
    coverImageUrl: PLACEHOLDER_IMAGES[1],
    weeklyOpens: 190,
    weeklyFavoritesAdded: 27,
    weeklyCookCompletions: 18,
  },
  {
    slug: 'sanduiche-natural-de-frango',
    title: 'Sanduíche natural de frango',
    description: 'Pão integral recheado com frango desfiado, cenoura e maionese caseira.',
    categoryKey: 'lanche',
    prepTimeMinutes: 20,
    timeBucket: 'quinze_30',
    servings: 2,
    difficulty: 'iniciante',
    dietPreference: 'flexitariano',
    coverImageUrl: PLACEHOLDER_IMAGES[2],
    weeklyOpens: 260,
    weeklyFavoritesAdded: 33,
    weeklyCookCompletions: 21,
  },
  {
    slug: 'mix-de-castanhas-temperadas',
    title: 'Mix de castanhas temperadas',
    description: 'Castanhas assadas com páprica defumada e ervas, ótimas para levar na bolsa.',
    categoryKey: 'lanche',
    prepTimeMinutes: 25,
    timeBucket: 'quinze_30',
    servings: 8,
    difficulty: 'iniciante',
    dietPreference: 'vegetariano',
    coverImageUrl: PLACEHOLDER_IMAGES[3],
    weeklyOpens: 95,
    weeklyFavoritesAdded: 8,
    weeklyCookCompletions: 4,
  },
  {
    slug: 'mousse-de-chocolate-vegano',
    title: 'Mousse de chocolate vegano',
    description: 'Mousse aerado feito com aquafaba e chocolate meio amargo.',
    categoryKey: 'sobremesa',
    prepTimeMinutes: 20,
    timeBucket: 'quinze_30',
    servings: 4,
    difficulty: 'intermediario',
    dietPreference: 'vegano',
    coverImageUrl: PLACEHOLDER_IMAGES[4],
    weeklyOpens: 730,
    weeklyFavoritesAdded: 121,
    weeklyCookCompletions: 58,
  },
  {
    slug: 'pudim-de-leite-condensado',
    title: 'Pudim de leite condensado',
    description: 'O clássico pudim brasileiro com calda de caramelo.',
    categoryKey: 'sobremesa',
    prepTimeMinutes: 65,
    timeBucket: 'sessenta_mais',
    servings: 8,
    difficulty: 'intermediario',
    dietPreference: 'vegetariano',
    coverImageUrl: PLACEHOLDER_IMAGES[5],
    weeklyOpens: 480,
    weeklyFavoritesAdded: 70,
    weeklyCookCompletions: 25,
  },
  {
    slug: 'bolo-de-cenoura-com-cobertura',
    title: 'Bolo de cenoura com cobertura de chocolate',
    description: 'Bolo fofinho de cenoura com cobertura brilhante de chocolate.',
    categoryKey: 'sobremesa',
    prepTimeMinutes: 55,
    timeBucket: 'trinta_60',
    servings: 10,
    difficulty: 'iniciante',
    dietPreference: 'flexitariano',
    coverImageUrl: PLACEHOLDER_IMAGES[0],
    weeklyOpens: 590,
    weeklyFavoritesAdded: 88,
    weeklyCookCompletions: 40,
  },
  {
    slug: 'suco-verde-detox',
    title: 'Suco verde detox',
    description: 'Suco de couve, maçã e limão, pronto em cinco minutos.',
    categoryKey: 'bebida',
    prepTimeMinutes: 5,
    timeBucket: 'ate_15',
    servings: 1,
    difficulty: 'iniciante',
    dietPreference: 'vegano',
    coverImageUrl: PLACEHOLDER_IMAGES[1],
    weeklyOpens: 310,
    weeklyFavoritesAdded: 44,
    weeklyCookCompletions: 29,
  },
  {
    slug: 'vitamina-de-abacate',
    title: 'Vitamina de abacate',
    description: 'Vitamina cremosa de abacate com leite e mel.',
    categoryKey: 'bebida',
    prepTimeMinutes: 8,
    timeBucket: 'ate_15',
    servings: 2,
    difficulty: 'iniciante',
    dietPreference: 'vegetariano',
    coverImageUrl: PLACEHOLDER_IMAGES[2],
    weeklyOpens: 175,
    weeklyFavoritesAdded: 20,
    weeklyCookCompletions: 13,
  },
  {
    slug: 'limonada-suica',
    title: 'Limonada suíça',
    description: 'Limonada batida com leite condensado, mais cremosa que a tradicional.',
    categoryKey: 'bebida',
    prepTimeMinutes: 10,
    timeBucket: 'ate_15',
    servings: 4,
    difficulty: 'iniciante',
    dietPreference: 'flexitariano',
    coverImageUrl: PLACEHOLDER_IMAGES[3],
    weeklyOpens: 230,
    weeklyFavoritesAdded: 25,
    weeklyCookCompletions: 9,
  },
  {
    slug: 'molho-pesto-de-manjericao',
    title: 'Molho pesto de manjericão',
    description: 'Pesto tradicional com manjericão fresco, castanhas e azeite.',
    categoryKey: 'molhos_acompanhamentos',
    prepTimeMinutes: 12,
    timeBucket: 'ate_15',
    servings: 4,
    difficulty: 'iniciante',
    dietPreference: 'vegetariano',
    coverImageUrl: PLACEHOLDER_IMAGES[4],
    weeklyOpens: 265,
    weeklyFavoritesAdded: 38,
    weeklyCookCompletions: 17,
  },
  {
    slug: 'farofa-de-banana',
    title: 'Farofa de banana',
    description: 'Farofa crocante com banana caramelizada, acompanhamento clássico.',
    categoryKey: 'molhos_acompanhamentos',
    prepTimeMinutes: 22,
    timeBucket: 'quinze_30',
    servings: 6,
    difficulty: 'iniciante',
    dietPreference: 'flexitariano',
    coverImageUrl: PLACEHOLDER_IMAGES[5],
    weeklyOpens: 140,
    weeklyFavoritesAdded: 14,
    weeklyCookCompletions: 6,
  },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_OF_HISTORY = 7;
const DAY_WEIGHTS = [0.22, 0.2, 0.12, 0.1, 0.14, 0.11, 0.11];

function distributeAcrossWeek(total: number, dayIndex: number): number {
  return Math.max(0, Math.round(total * DAY_WEIGHTS[dayIndex]));
}

async function seedCategories(prisma: PrismaClient): Promise<Map<RecipeCategory, string>> {
  const categoryIds = new Map<RecipeCategory, string>();
  for (const category of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { key: category.key },
      update: { label: category.label },
      create: { key: category.key, label: category.label },
    });
    categoryIds.set(category.key, record.id);
  }
  return categoryIds;
}

async function seedRecipes(
  prisma: PrismaClient,
  categoryIds: Map<RecipeCategory, string>,
): Promise<void> {
  const today = new Date();
  for (const recipeSeed of RECIPES) {
    const categoryId = categoryIds.get(recipeSeed.categoryKey);
    if (!categoryId) {
      throw new Error(`Unknown category key in seed data: ${recipeSeed.categoryKey}`);
    }

    const recipe = await prisma.recipe.upsert({
      where: { slug: recipeSeed.slug },
      update: {
        title: recipeSeed.title,
        description: recipeSeed.description,
        coverImageUrl: recipeSeed.coverImageUrl,
        categoryId,
        prepTimeMinutes: recipeSeed.prepTimeMinutes,
        timeBucket: recipeSeed.timeBucket,
        servings: recipeSeed.servings,
        difficulty: recipeSeed.difficulty,
        dietPreference: recipeSeed.dietPreference,
        status: 'aprovada',
      },
      create: {
        slug: recipeSeed.slug,
        title: recipeSeed.title,
        description: recipeSeed.description,
        coverImageUrl: recipeSeed.coverImageUrl,
        categoryId,
        prepTimeMinutes: recipeSeed.prepTimeMinutes,
        timeBucket: recipeSeed.timeBucket,
        servings: recipeSeed.servings,
        difficulty: recipeSeed.difficulty,
        dietPreference: recipeSeed.dietPreference,
        status: 'aprovada',
        approvedAt: today,
      },
    });

    for (let dayIndex = 0; dayIndex < DAYS_OF_HISTORY; dayIndex += 1) {
      const date = new Date(today.getTime() - dayIndex * MS_PER_DAY);
      date.setUTCHours(0, 0, 0, 0);

      await prisma.recipeDailyStats.upsert({
        where: { recipeId_date: { recipeId: recipe.id, date } },
        update: {
          opens: distributeAcrossWeek(recipeSeed.weeklyOpens, dayIndex),
          favoritesAdded: distributeAcrossWeek(recipeSeed.weeklyFavoritesAdded, dayIndex),
          cookCompletions: distributeAcrossWeek(recipeSeed.weeklyCookCompletions, dayIndex),
        },
        create: {
          recipeId: recipe.id,
          date,
          opens: distributeAcrossWeek(recipeSeed.weeklyOpens, dayIndex),
          favoritesAdded: distributeAcrossWeek(recipeSeed.weeklyFavoritesAdded, dayIndex),
          cookCompletions: distributeAcrossWeek(recipeSeed.weeklyCookCompletions, dayIndex),
        },
      });
    }
  }
}

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

    const categoryIds = await seedCategories(prisma);
    await seedRecipes(prisma, categoryIds);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
