import {
  DietPreference,
  CookingLevel,
  IngredientUnit,
  PrismaClient,
  RecipeCategory,
  TimeBucket,
} from '@prisma/client';

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

/**
 * Fixed fixtures consumed directly by task_03's integration tests
 * (IT-002, IT-003, IT-004) — keep slugs/ids stable across seed runs.
 */
const SEEDED_ALLERGY_CONFLICTS: { recipeSlug: string; allergenName: string }[] =
  [
    { recipeSlug: 'omelete-de-espinafre', allergenName: 'Leite' },
    { recipeSlug: 'pudim-de-leite-condensado', allergenName: 'Leite' },
    { recipeSlug: 'limonada-suica', allergenName: 'Leite' },
  ];

// Fixed fixture consumed by the comentarios-avaliacoes Maestro suite (E2E-004):
// a comment from another (non-logged-in) seeded author, so "denunciar comentário"
// can be exercised against a stable, non-own comment without a second auth session.
const SEEDED_COMMENT_ID = '00000000-0000-0000-0000-000000000002';
const SEEDED_COMMENT_AUTHOR_ID = 'seed-other-user';
const SEEDED_COMMENT = {
  recipeSlug: 'omelete-de-espinafre',
  authorName: 'Marina Souza',
  rating: 5,
  commentText: 'Muito bom, fácil de fazer!',
};

const EDITORIAL_BOOST_SEED_ID = '00000000-0000-0000-0000-000000000001';
const EDITORIAL_BOOST_SEED_ADMIN_ID = 'seed-admin';
const EDITORIAL_BOOST_SEED = {
  recipeSlug: 'mix-de-castanhas-temperadas',
  weight: 50,
  startsAtOffsetDays: -1,
  endsAtOffsetDays: 7,
};

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
    description:
      'Panquecas fofinhas feitas com banana amassada e aveia, sem leite nem ovos.',
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
    description:
      'Omelete simples com espinafre refogado e queijo, pronto em poucos minutos.',
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
    description:
      'Granola assada com aveia, castanhas e mel, servida com frutas frescas.',
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
    description:
      'Versão vegana do clássico strogonoff, com grão-de-bico e creme de castanha.',
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
    description:
      'Peito de frango grelhado servido com legumes salteados na manteiga.',
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
    description:
      'Wrap recheado com pasta de grão-de-bico temperada e vegetais crocantes.',
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
    description:
      'Pão integral recheado com frango desfiado, cenoura e maionese caseira.',
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
    description:
      'Castanhas assadas com páprica defumada e ervas, ótimas para levar na bolsa.',
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
    description:
      'Bolo fofinho de cenoura com cobertura brilhante de chocolate.',
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
    description:
      'Limonada batida com leite condensado, mais cremosa que a tradicional.',
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
    description:
      'Farofa crocante com banana caramelizada, acompanhamento clássico.',
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

interface IngredientSeed {
  name: string;
  quantity: number | null;
  unit: IngredientUnit;
  scalesWithServings: boolean;
}

interface StepSeed {
  description: string;
  stepTimeSeconds: number | null;
}

/**
 * Structured ingredients/steps for the recipes above (ADR-001). Every
 * recipe carries at least one non-scalable item (salt/pepper/bay leaf, or
 * a `pitada`/`a_gosto` unit, which are non-scalable by definition per
 * `docs/04-data-contract-schema-spec.md` §3.7).
 */
const RECIPE_DETAILS: Record<
  string,
  { ingredients: IngredientSeed[]; steps: StepSeed[] }
> = {
  'panqueca-de-banana-vegana': {
    ingredients: [
      {
        name: 'Banana madura',
        quantity: 2,
        unit: 'unidade',
        scalesWithServings: true,
      },
      {
        name: 'Aveia em flocos',
        quantity: 1,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Leite vegetal',
        quantity: 100,
        unit: 'ml',
        scalesWithServings: true,
      },
      {
        name: 'Fermento em pó',
        quantity: 1,
        unit: 'colher_cha',
        scalesWithServings: true,
      },
      {
        name: 'Canela em pó',
        quantity: null,
        unit: 'a_gosto',
        scalesWithServings: false,
      },
      { name: 'Sal', quantity: 1, unit: 'pitada', scalesWithServings: false },
    ],
    steps: [
      {
        description: 'Amasse as bananas até formar um purê.',
        stepTimeSeconds: 120,
      },
      {
        description:
          'Misture a aveia, o leite vegetal, o fermento e a canela ao purê.',
        stepTimeSeconds: 180,
      },
      {
        description: 'Aqueça uma frigideira antiaderente em fogo médio.',
        stepTimeSeconds: 120,
      },
      {
        description: 'Despeje porções da massa e doure dos dois lados.',
        stepTimeSeconds: 360,
      },
    ],
  },
  'omelete-de-espinafre': {
    ingredients: [
      { name: 'Ovos', quantity: 3, unit: 'unidade', scalesWithServings: true },
      {
        name: 'Espinafre refogado',
        quantity: 1,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Queijo ralado',
        quantity: 30,
        unit: 'g',
        scalesWithServings: true,
      },
      {
        name: 'Azeite',
        quantity: 1,
        unit: 'colher_sopa',
        scalesWithServings: true,
      },
      { name: 'Sal', quantity: 1, unit: 'pitada', scalesWithServings: false },
      {
        name: 'Pimenta-do-reino',
        quantity: null,
        unit: 'a_gosto',
        scalesWithServings: false,
      },
    ],
    steps: [
      { description: 'Bata os ovos com sal e pimenta.', stepTimeSeconds: 90 },
      {
        description: 'Refogue o espinafre no azeite até murchar.',
        stepTimeSeconds: 180,
      },
      {
        description:
          'Despeje os ovos batidos sobre o espinafre e adicione o queijo.',
        stepTimeSeconds: 60,
      },
      {
        description: 'Cozinhe em fogo baixo até firmar e dobre ao meio.',
        stepTimeSeconds: 240,
      },
    ],
  },
  'granola-caseira-com-frutas': {
    ingredients: [
      {
        name: 'Aveia em flocos',
        quantity: 3,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Castanhas picadas',
        quantity: 1,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Mel',
        quantity: 3,
        unit: 'colher_sopa',
        scalesWithServings: true,
      },
      {
        name: 'Óleo de coco',
        quantity: 2,
        unit: 'colher_sopa',
        scalesWithServings: true,
      },
      {
        name: 'Frutas frescas para servir',
        quantity: null,
        unit: 'a_gosto',
        scalesWithServings: false,
      },
      { name: 'Sal', quantity: 1, unit: 'pitada', scalesWithServings: false },
    ],
    steps: [
      { description: 'Pré-aqueça o forno a 160°C.', stepTimeSeconds: 300 },
      {
        description: 'Misture aveia, castanhas, mel, óleo de coco e sal.',
        stepTimeSeconds: 180,
      },
      { description: 'Espalhe em uma assadeira forrada.', stepTimeSeconds: 60 },
      {
        description: 'Asse mexendo a cada 10 minutos até dourar.',
        stepTimeSeconds: 1500,
      },
      {
        description: 'Deixe esfriar e sirva com frutas frescas.',
        stepTimeSeconds: 300,
      },
    ],
  },
  'strogonoff-de-grao-de-bico': {
    ingredients: [
      {
        name: 'Grão-de-bico cozido',
        quantity: 2,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Creme de castanha',
        quantity: 200,
        unit: 'ml',
        scalesWithServings: true,
      },
      {
        name: 'Cebola picada',
        quantity: 1,
        unit: 'unidade',
        scalesWithServings: true,
      },
      {
        name: 'Molho de tomate',
        quantity: 3,
        unit: 'colher_sopa',
        scalesWithServings: true,
      },
      {
        name: 'Louro',
        quantity: 1,
        unit: 'unidade',
        scalesWithServings: false,
      },
      { name: 'Sal', quantity: 1, unit: 'pitada', scalesWithServings: false },
    ],
    steps: [
      {
        description: 'Refogue a cebola e o louro até dourar.',
        stepTimeSeconds: 300,
      },
      {
        description: 'Adicione o grão-de-bico e o molho de tomate.',
        stepTimeSeconds: 180,
      },
      {
        description: 'Junte o creme de castanha e o sal, mexendo bem.',
        stepTimeSeconds: 120,
      },
      {
        description: 'Cozinhe em fogo baixo até engrossar.',
        stepTimeSeconds: 600,
      },
    ],
  },
  'risoto-de-cogumelos': {
    ingredients: [
      {
        name: 'Arroz arbóreo',
        quantity: 1.5,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Cogumelos frescos fatiados',
        quantity: 2,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Caldo de legumes',
        quantity: 750,
        unit: 'ml',
        scalesWithServings: true,
      },
      {
        name: 'Parmesão ralado',
        quantity: 50,
        unit: 'g',
        scalesWithServings: true,
      },
      {
        name: 'Manteiga',
        quantity: 1,
        unit: 'colher_sopa',
        scalesWithServings: true,
      },
      { name: 'Sal', quantity: 1, unit: 'pitada', scalesWithServings: false },
    ],
    steps: [
      {
        description: 'Refogue os cogumelos na manteiga até dourar e reserve.',
        stepTimeSeconds: 300,
      },
      {
        description: 'Toste o arroz arbóreo na mesma panela.',
        stepTimeSeconds: 120,
      },
      {
        description: 'Adicione o caldo aos poucos, mexendo sempre.',
        stepTimeSeconds: 1200,
      },
      {
        description: 'Misture os cogumelos e o parmesão ao final.',
        stepTimeSeconds: 180,
      },
      {
        description: 'Ajuste o sal e sirva imediatamente.',
        stepTimeSeconds: 60,
      },
    ],
  },
  'frango-grelhado-com-legumes': {
    ingredients: [
      {
        name: 'Peito de frango',
        quantity: 2,
        unit: 'unidade',
        scalesWithServings: true,
      },
      {
        name: 'Cenoura em rodelas',
        quantity: 1,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Brócolis',
        quantity: 1,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Manteiga',
        quantity: 1,
        unit: 'colher_sopa',
        scalesWithServings: true,
      },
      { name: 'Sal', quantity: 1, unit: 'pitada', scalesWithServings: false },
      {
        name: 'Ervas finas',
        quantity: null,
        unit: 'a_gosto',
        scalesWithServings: false,
      },
    ],
    steps: [
      {
        description: 'Tempere o frango com sal e ervas finas.',
        stepTimeSeconds: 300,
      },
      {
        description: 'Grelhe o frango até dourar dos dois lados.',
        stepTimeSeconds: 600,
      },
      {
        description: 'Saltear os legumes na manteiga até ficarem macios.',
        stepTimeSeconds: 420,
      },
      {
        description: 'Sirva o frango acompanhado dos legumes.',
        stepTimeSeconds: 60,
      },
    ],
  },
  'feijoada-simplificada': {
    ingredients: [
      {
        name: 'Feijão preto cozido',
        quantity: 3,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Linguiça calabresa',
        quantity: 200,
        unit: 'g',
        scalesWithServings: true,
      },
      {
        name: 'Bacon em cubos',
        quantity: 100,
        unit: 'g',
        scalesWithServings: true,
      },
      {
        name: 'Cebola picada',
        quantity: 1,
        unit: 'unidade',
        scalesWithServings: true,
      },
      {
        name: 'Louro',
        quantity: 2,
        unit: 'unidade',
        scalesWithServings: false,
      },
      { name: 'Sal', quantity: 1, unit: 'pitada', scalesWithServings: false },
    ],
    steps: [
      {
        description: 'Doure o bacon e a linguiça em uma panela grande.',
        stepTimeSeconds: 420,
      },
      {
        description: 'Adicione a cebola e o louro, refogando até murchar.',
        stepTimeSeconds: 240,
      },
      { description: 'Junte o feijão cozido e o sal.', stepTimeSeconds: 120 },
      {
        description: 'Cozinhe em fogo médio até encorpar.',
        stepTimeSeconds: 1800,
      },
    ],
  },
  'wrap-de-grao-de-bico': {
    ingredients: [
      {
        name: 'Tortilha integral',
        quantity: 1,
        unit: 'unidade',
        scalesWithServings: true,
      },
      {
        name: 'Pasta de grão-de-bico',
        quantity: 0.5,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Alface picada',
        quantity: 0.5,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Tomate em cubos',
        quantity: 0.5,
        unit: 'xicara',
        scalesWithServings: true,
      },
      { name: 'Sal', quantity: 1, unit: 'pitada', scalesWithServings: false },
    ],
    steps: [
      {
        description: 'Espalhe a pasta de grão-de-bico sobre a tortilha.',
        stepTimeSeconds: 90,
      },
      {
        description: 'Adicione a alface, o tomate e o sal.',
        stepTimeSeconds: 90,
      },
      {
        description: 'Enrole firmemente e corte ao meio.',
        stepTimeSeconds: 60,
      },
    ],
  },
  'sanduiche-natural-de-frango': {
    ingredients: [
      {
        name: 'Pão integral',
        quantity: 2,
        unit: 'unidade',
        scalesWithServings: true,
      },
      {
        name: 'Frango desfiado',
        quantity: 1,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Cenoura ralada',
        quantity: 0.5,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Maionese caseira',
        quantity: 2,
        unit: 'colher_sopa',
        scalesWithServings: true,
      },
      { name: 'Sal', quantity: 1, unit: 'pitada', scalesWithServings: false },
    ],
    steps: [
      {
        description:
          'Misture o frango desfiado, a cenoura, a maionese e o sal.',
        stepTimeSeconds: 180,
      },
      {
        description: 'Recheie as fatias de pão com a mistura.',
        stepTimeSeconds: 90,
      },
      {
        description: 'Feche o sanduíche e corte ao meio para servir.',
        stepTimeSeconds: 60,
      },
    ],
  },
  'mix-de-castanhas-temperadas': {
    ingredients: [
      {
        name: 'Castanha-do-pará',
        quantity: 0.5,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Amêndoas',
        quantity: 0.5,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Nozes',
        quantity: 0.5,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Azeite',
        quantity: 1,
        unit: 'colher_sopa',
        scalesWithServings: true,
      },
      {
        name: 'Páprica defumada',
        quantity: 1,
        unit: 'colher_cha',
        scalesWithServings: true,
      },
      { name: 'Sal', quantity: 1, unit: 'pitada', scalesWithServings: false },
    ],
    steps: [
      { description: 'Pré-aqueça o forno a 180°C.', stepTimeSeconds: 300 },
      {
        description: 'Misture as castanhas com azeite, páprica e sal.',
        stepTimeSeconds: 180,
      },
      {
        description: 'Espalhe em uma assadeira e asse até dourar.',
        stepTimeSeconds: 600,
      },
      { description: 'Deixe esfriar antes de servir.', stepTimeSeconds: 300 },
    ],
  },
  'mousse-de-chocolate-vegano': {
    ingredients: [
      {
        name: 'Aquafaba',
        quantity: 1,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Chocolate meio amargo derretido',
        quantity: 150,
        unit: 'g',
        scalesWithServings: true,
      },
      {
        name: 'Açúcar',
        quantity: 2,
        unit: 'colher_sopa',
        scalesWithServings: true,
      },
      {
        name: 'Essência de baunilha',
        quantity: null,
        unit: 'a_gosto',
        scalesWithServings: false,
      },
      { name: 'Sal', quantity: 1, unit: 'pitada', scalesWithServings: false },
    ],
    steps: [
      {
        description: 'Bata a aquafaba em ponto de neve.',
        stepTimeSeconds: 420,
      },
      {
        description: 'Incorpore o açúcar aos poucos, batendo sempre.',
        stepTimeSeconds: 180,
      },
      {
        description:
          'Adicione o chocolate derretido e a baunilha delicadamente.',
        stepTimeSeconds: 180,
      },
      {
        description:
          'Leve à geladeira por pelo menos duas horas antes de servir.',
        stepTimeSeconds: 7200,
      },
    ],
  },
  'pudim-de-leite-condensado': {
    ingredients: [
      {
        name: 'Leite condensado',
        quantity: 1,
        unit: 'unidade',
        scalesWithServings: true,
      },
      { name: 'Leite', quantity: 1, unit: 'xicara', scalesWithServings: true },
      { name: 'Ovos', quantity: 3, unit: 'unidade', scalesWithServings: true },
      {
        name: 'Açúcar para a calda',
        quantity: 1,
        unit: 'xicara',
        scalesWithServings: true,
      },
      { name: 'Sal', quantity: 1, unit: 'pitada', scalesWithServings: false },
    ],
    steps: [
      {
        description:
          'Prepare a calda derretendo o açúcar até dourar e forre a forma.',
        stepTimeSeconds: 480,
      },
      {
        description:
          'Bata o leite condensado, o leite e os ovos no liquidificador.',
        stepTimeSeconds: 180,
      },
      {
        description: 'Despeje a mistura na forma caramelizada.',
        stepTimeSeconds: 60,
      },
      { description: 'Asse em banho-maria até firmar.', stepTimeSeconds: 3600 },
      {
        description: 'Deixe esfriar e leve à geladeira antes de desenformar.',
        stepTimeSeconds: 7200,
      },
    ],
  },
  'bolo-de-cenoura-com-cobertura': {
    ingredients: [
      {
        name: 'Cenoura',
        quantity: 3,
        unit: 'unidade',
        scalesWithServings: true,
      },
      {
        name: 'Farinha de trigo',
        quantity: 2,
        unit: 'xicara',
        scalesWithServings: true,
      },
      { name: 'Ovos', quantity: 3, unit: 'unidade', scalesWithServings: true },
      { name: 'Óleo', quantity: 1, unit: 'xicara', scalesWithServings: true },
      {
        name: 'Chocolate em pó para a cobertura',
        quantity: 4,
        unit: 'colher_sopa',
        scalesWithServings: true,
      },
      { name: 'Sal', quantity: 1, unit: 'pitada', scalesWithServings: false },
    ],
    steps: [
      {
        description: 'Bata a cenoura, os ovos e o óleo no liquidificador.',
        stepTimeSeconds: 180,
      },
      {
        description: 'Misture a farinha e o sal delicadamente.',
        stepTimeSeconds: 180,
      },
      {
        description: 'Asse em forma untada por cerca de 40 minutos.',
        stepTimeSeconds: 2400,
      },
      {
        description:
          'Prepare a cobertura de chocolate e derrame sobre o bolo já frio.',
        stepTimeSeconds: 420,
      },
    ],
  },
  'suco-verde-detox': {
    ingredients: [
      { name: 'Couve', quantity: 2, unit: 'unidade', scalesWithServings: true },
      { name: 'Maçã', quantity: 1, unit: 'unidade', scalesWithServings: true },
      {
        name: 'Limão',
        quantity: 0.5,
        unit: 'unidade',
        scalesWithServings: true,
      },
      { name: 'Água', quantity: 300, unit: 'ml', scalesWithServings: true },
      {
        name: 'Gengibre',
        quantity: null,
        unit: 'a_gosto',
        scalesWithServings: false,
      },
    ],
    steps: [
      { description: 'Lave bem a couve e a maçã.', stepTimeSeconds: 120 },
      {
        description: 'Bata todos os ingredientes no liquidificador.',
        stepTimeSeconds: 120,
      },
      {
        description: 'Coe se preferir uma textura mais leve e sirva gelado.',
        stepTimeSeconds: 60,
      },
    ],
  },
  'vitamina-de-abacate': {
    ingredients: [
      {
        name: 'Abacate',
        quantity: 1,
        unit: 'unidade',
        scalesWithServings: true,
      },
      { name: 'Leite', quantity: 300, unit: 'ml', scalesWithServings: true },
      {
        name: 'Mel',
        quantity: 2,
        unit: 'colher_sopa',
        scalesWithServings: true,
      },
      {
        name: 'Gelo',
        quantity: null,
        unit: 'a_gosto',
        scalesWithServings: false,
      },
    ],
    steps: [
      { description: 'Retire a polpa do abacate.', stepTimeSeconds: 120 },
      {
        description:
          'Bata o abacate, o leite, o mel e o gelo no liquidificador.',
        stepTimeSeconds: 120,
      },
      { description: 'Sirva imediatamente bem gelado.', stepTimeSeconds: 30 },
    ],
  },
  'limonada-suica': {
    ingredients: [
      { name: 'Limão', quantity: 3, unit: 'unidade', scalesWithServings: true },
      {
        name: 'Leite condensado',
        quantity: 0.5,
        unit: 'unidade',
        scalesWithServings: true,
      },
      {
        name: 'Água gelada',
        quantity: 500,
        unit: 'ml',
        scalesWithServings: true,
      },
      {
        name: 'Gelo',
        quantity: null,
        unit: 'a_gosto',
        scalesWithServings: false,
      },
    ],
    steps: [
      {
        description: 'Corte os limões em pedaços, retirando as sementes.',
        stepTimeSeconds: 120,
      },
      {
        description:
          'Bata os limões com a água gelada rapidamente no liquidificador.',
        stepTimeSeconds: 30,
      },
      { description: 'Coe e misture o leite condensado.', stepTimeSeconds: 90 },
      { description: 'Sirva com gelo.', stepTimeSeconds: 30 },
    ],
  },
  'molho-pesto-de-manjericao': {
    ingredients: [
      {
        name: 'Manjericão fresco',
        quantity: 2,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Castanhas',
        quantity: 0.5,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Parmesão ralado',
        quantity: 50,
        unit: 'g',
        scalesWithServings: true,
      },
      {
        name: 'Azeite',
        quantity: 0.5,
        unit: 'xicara',
        scalesWithServings: true,
      },
      { name: 'Alho', quantity: 1, unit: 'unidade', scalesWithServings: false },
      { name: 'Sal', quantity: 1, unit: 'pitada', scalesWithServings: false },
    ],
    steps: [
      {
        description:
          'Bata o manjericão, as castanhas, o alho e o sal no processador.',
        stepTimeSeconds: 180,
      },
      {
        description:
          'Adicione o azeite aos poucos até formar uma pasta homogênea.',
        stepTimeSeconds: 120,
      },
      {
        description: 'Misture o parmesão ralado ao final.',
        stepTimeSeconds: 60,
      },
    ],
  },
  'farofa-de-banana': {
    ingredients: [
      {
        name: 'Farinha de mandioca',
        quantity: 2,
        unit: 'xicara',
        scalesWithServings: true,
      },
      {
        name: 'Banana-da-terra',
        quantity: 2,
        unit: 'unidade',
        scalesWithServings: true,
      },
      {
        name: 'Manteiga',
        quantity: 2,
        unit: 'colher_sopa',
        scalesWithServings: true,
      },
      {
        name: 'Açúcar',
        quantity: 1,
        unit: 'colher_sopa',
        scalesWithServings: true,
      },
      { name: 'Sal', quantity: 1, unit: 'pitada', scalesWithServings: false },
    ],
    steps: [
      {
        description:
          'Corte as bananas em rodelas e caramelize na manteiga com açúcar.',
        stepTimeSeconds: 420,
      },
      { description: 'Retire as bananas e reserve.', stepTimeSeconds: 60 },
      {
        description:
          'Torre a farinha de mandioca na manteiga restante com sal.',
        stepTimeSeconds: 300,
      },
      {
        description: 'Misture a banana caramelizada à farofa e sirva.',
        stepTimeSeconds: 60,
      },
    ],
  },
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_OF_HISTORY = 7;
const DAY_WEIGHTS = [0.22, 0.2, 0.12, 0.1, 0.14, 0.11, 0.11];

function distributeAcrossWeek(total: number, dayIndex: number): number {
  return Math.max(0, Math.round(total * DAY_WEIGHTS[dayIndex]));
}

async function seedCategories(
  prisma: PrismaClient,
): Promise<Map<RecipeCategory, string>> {
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
      throw new Error(
        `Unknown category key in seed data: ${recipeSeed.categoryKey}`,
      );
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
          favoritesAdded: distributeAcrossWeek(
            recipeSeed.weeklyFavoritesAdded,
            dayIndex,
          ),
          cookCompletions: distributeAcrossWeek(
            recipeSeed.weeklyCookCompletions,
            dayIndex,
          ),
        },
        create: {
          recipeId: recipe.id,
          date,
          opens: distributeAcrossWeek(recipeSeed.weeklyOpens, dayIndex),
          favoritesAdded: distributeAcrossWeek(
            recipeSeed.weeklyFavoritesAdded,
            dayIndex,
          ),
          cookCompletions: distributeAcrossWeek(
            recipeSeed.weeklyCookCompletions,
            dayIndex,
          ),
        },
      });
    }
  }
}

async function seedRecipeDetails(prisma: PrismaClient): Promise<void> {
  for (const recipeSeed of RECIPES) {
    const details = RECIPE_DETAILS[recipeSeed.slug];
    if (!details) {
      throw new Error(
        `Missing RecipeIngredient/RecipeStep seed data for slug: ${recipeSeed.slug}`,
      );
    }

    const recipe = await prisma.recipe.findUniqueOrThrow({
      where: { slug: recipeSeed.slug },
    });

    for (const [index, ingredient] of details.ingredients.entries()) {
      const order = index + 1;
      await prisma.recipeIngredient.upsert({
        where: { recipeId_order: { recipeId: recipe.id, order } },
        update: {
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          scalesWithServings: ingredient.scalesWithServings,
        },
        create: {
          recipeId: recipe.id,
          order,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          scalesWithServings: ingredient.scalesWithServings,
        },
      });
    }

    for (const [index, step] of details.steps.entries()) {
      const order = index + 1;
      await prisma.recipeStep.upsert({
        where: { recipeId_order: { recipeId: recipe.id, order } },
        update: {
          description: step.description,
          stepTimeSeconds: step.stepTimeSeconds,
        },
        create: {
          recipeId: recipe.id,
          order,
          description: step.description,
          stepTimeSeconds: step.stepTimeSeconds,
        },
      });
    }
  }
}

async function seedAllergyConflicts(prisma: PrismaClient): Promise<void> {
  for (const conflict of SEEDED_ALLERGY_CONFLICTS) {
    const recipe = await prisma.recipe.findUniqueOrThrow({
      where: { slug: conflict.recipeSlug },
    });
    const allergen = await prisma.allergen.findUniqueOrThrow({
      where: { name: conflict.allergenName },
    });

    await prisma.recipeAllergen.upsert({
      where: {
        recipeId_allergenId: { recipeId: recipe.id, allergenId: allergen.id },
      },
      update: {},
      create: { recipeId: recipe.id, allergenId: allergen.id },
    });
  }
}

async function seedComments(prisma: PrismaClient): Promise<void> {
  const recipe = await prisma.recipe.findUniqueOrThrow({
    where: { slug: SEEDED_COMMENT.recipeSlug },
  });

  await prisma.user.upsert({
    where: { id: SEEDED_COMMENT_AUTHOR_ID },
    update: {},
    create: {
      id: SEEDED_COMMENT_AUTHOR_ID,
      email: 'marina.souza@example.com',
      username: 'marina.souza',
      name: SEEDED_COMMENT.authorName,
    },
  });

  await prisma.commentRating.upsert({
    where: { id: SEEDED_COMMENT_ID },
    update: {
      recipeId: recipe.id,
      userId: SEEDED_COMMENT_AUTHOR_ID,
      rating: SEEDED_COMMENT.rating,
      commentText: SEEDED_COMMENT.commentText,
    },
    create: {
      id: SEEDED_COMMENT_ID,
      recipeId: recipe.id,
      userId: SEEDED_COMMENT_AUTHOR_ID,
      rating: SEEDED_COMMENT.rating,
      commentText: SEEDED_COMMENT.commentText,
    },
  });
}

async function seedEditorialBoost(prisma: PrismaClient): Promise<void> {
  const recipe = await prisma.recipe.findUniqueOrThrow({
    where: { slug: EDITORIAL_BOOST_SEED.recipeSlug },
  });
  const today = new Date();
  const startsAt = new Date(
    today.getTime() + EDITORIAL_BOOST_SEED.startsAtOffsetDays * MS_PER_DAY,
  );
  const endsAt = new Date(
    today.getTime() + EDITORIAL_BOOST_SEED.endsAtOffsetDays * MS_PER_DAY,
  );

  await prisma.editorialBoost.upsert({
    where: { id: EDITORIAL_BOOST_SEED_ID },
    update: {
      recipeId: recipe.id,
      weight: EDITORIAL_BOOST_SEED.weight,
      appliedByAdminId: EDITORIAL_BOOST_SEED_ADMIN_ID,
      startsAt,
      endsAt,
    },
    create: {
      id: EDITORIAL_BOOST_SEED_ID,
      recipeId: recipe.id,
      weight: EDITORIAL_BOOST_SEED.weight,
      appliedByAdminId: EDITORIAL_BOOST_SEED_ADMIN_ID,
      startsAt,
      endsAt,
    },
  });
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
    await seedRecipeDetails(prisma);
    await seedAllergyConflicts(prisma);
    await seedComments(prisma);
    await seedEditorialBoost(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
