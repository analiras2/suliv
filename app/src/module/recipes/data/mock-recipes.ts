import type { DayPlanEntry } from '@/module/recipes/types';

export const WEEK_PLAN: DayPlanEntry[] = [
  { day: 'seg', label: '22', recipe: { title: 'Creme de abóbora com tahine', meta: 'jantar · 15 min' }, done: true },
  { day: 'ter', label: '23', recipe: { title: 'Salada morna de lentilha', meta: 'almoço · 20 min' }, done: true },
  { day: 'qua', label: '24', recipe: { title: 'Bowl de arroz e shimeji', meta: 'jantar · 18 min' }, done: true },
  { day: 'qui', label: '25', recipe: { title: 'Panqueca de banana e aveia', meta: 'café · 10 min' }, done: true },
  { day: 'sex', label: '26', recipe: { title: 'Sopa de tomate assado', meta: 'jantar · 30 min' }, done: false },
  { day: 'sáb', label: '27', recipe: { title: 'Grão-de-bico crocante', meta: 'snack · 25 min' }, done: false },
  { day: 'dom', label: '28', recipe: { title: 'Escolher depois', meta: 'toque para montar' }, done: false },
];
