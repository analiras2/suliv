import type { DayPlanEntry, RecipeGradientKey } from '@/module/recipes/types';

interface LegacyRecipeDetail {
  id: string;
  title: string;
  meta: string;
  time: string;
  gradient: RecipeGradientKey;
  servings: number;
  proteinGrams: number;
  kcal: number;
  description: string;
  ingredients: string[];
}

export const RECIPES: LegacyRecipeDetail[] = [
  {
    id: 'r1',
    title: 'Creme de abóbora com tahine',
    meta: 'confortante · 1 panela',
    time: '15 min',
    gradient: 'clay',
    servings: 2,
    proteinGrams: 14,
    kcal: 320,
    description: 'Um prato de colher pra dias que pedem algo morno.',
    ingredients: [
      '1 abóbora cabotiá pequena',
      '2 col. de tahine',
      '1 cebola roxa',
      'alho, sal, azeite',
      'folhas de manjericão',
    ],
  },
  {
    id: 'r2',
    title: 'Salada morna de lentilha',
    meta: 'proteína · folhas · limão',
    time: '20 min',
    gradient: 'moss',
    servings: 2,
    proteinGrams: 18,
    kcal: 340,
    description: 'Leve, com proteína de verdade e um toque cítrico.',
    ingredients: ['1 xíc. de lentilha cozida', 'folhas verdes', '1 limão', 'azeite, sal', 'sementes torradas'],
  },
  {
    id: 'r3',
    title: 'Grão-de-bico crocante',
    meta: 'snack · forno · páprica',
    time: '25 min',
    gradient: 'sand',
    servings: 3,
    proteinGrams: 12,
    kcal: 210,
    description: 'Crocante por fora, ótimo pra beliscar sem culpa.',
    ingredients: ['2 latas de grão-de-bico', 'páprica defumada', 'azeite', 'sal', 'alho em pó'],
  },
  {
    id: 'r4',
    title: 'Bowl de arroz e shimeji',
    meta: 'jantar · rápido',
    time: '18 min',
    gradient: 'olive',
    servings: 2,
    proteinGrams: 10,
    kcal: 380,
    description: 'Jantar rápido de fim de dia, sem complicação.',
    ingredients: ['2 xíc. de arroz cozido', '200 g de shimeji', 'shoyu', 'gengibre', 'cebolinha'],
  },
  {
    id: 'r5',
    title: 'Panqueca de banana e aveia',
    meta: 'café da manhã · 2 pessoas',
    time: '10 min',
    gradient: 'peach',
    servings: 2,
    proteinGrams: 9,
    kcal: 260,
    description: 'Café da manhã rápido, doce na medida certa.',
    ingredients: ['2 bananas maduras', '1 xíc. de aveia', '2 ovos de linhaça', 'canela', 'óleo de coco'],
  },
  {
    id: 'r6',
    title: 'Sopa de tomate assado',
    meta: 'reconfortante · manjericão',
    time: '30 min',
    gradient: 'brick',
    servings: 4,
    proteinGrams: 8,
    kcal: 190,
    description: 'Sopa reconfortante, boa pra guardar em potinhos.',
    ingredients: ['1 kg de tomate', '1 cebola', 'alho', 'manjericão fresco', 'azeite'],
  },
];

export const WEEK_PLAN: DayPlanEntry[] = [
  { day: 'seg', label: '22', recipe: { title: 'Creme de abóbora com tahine', meta: 'jantar · 15 min' }, done: true },
  { day: 'ter', label: '23', recipe: { title: 'Salada morna de lentilha', meta: 'almoço · 20 min' }, done: true },
  { day: 'qua', label: '24', recipe: { title: 'Bowl de arroz e shimeji', meta: 'jantar · 18 min' }, done: true },
  { day: 'qui', label: '25', recipe: { title: 'Panqueca de banana e aveia', meta: 'café · 10 min' }, done: true },
  { day: 'sex', label: '26', recipe: { title: 'Sopa de tomate assado', meta: 'jantar · 30 min' }, done: false },
  { day: 'sáb', label: '27', recipe: { title: 'Grão-de-bico crocante', meta: 'snack · 25 min' }, done: false },
  { day: 'dom', label: '28', recipe: { title: 'Escolher depois', meta: 'toque para montar' }, done: false },
];
