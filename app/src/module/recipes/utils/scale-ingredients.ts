export type IngredientUnit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'unidade'
  | 'xicara'
  | 'colher_sopa'
  | 'colher_cha'
  | 'pitada'
  | 'a_gosto';

export interface RecipeIngredientDto {
  name: string;
  quantity: number | null;
  unit: IngredientUnit;
  scalesWithServings: boolean;
}

export interface ScaledIngredient {
  name: string;
  displayQuantity: string;
}

const NON_SCALABLE_UNITS: readonly IngredientUnit[] = ['pitada', 'a_gosto'];
const QUANTITY_ROUNDING_STEP = 0.25;
const FRACTION_GLYPHS: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

const UNIT_LABELS: Record<IngredientUnit, { singular: string; plural: string }> = {
  g: { singular: 'g', plural: 'g' },
  kg: { singular: 'kg', plural: 'kg' },
  ml: { singular: 'ml', plural: 'ml' },
  l: { singular: 'l', plural: 'l' },
  unidade: { singular: 'unidade', plural: 'unidades' },
  xicara: { singular: 'xícara', plural: 'xícaras' },
  colher_sopa: { singular: 'colher de sopa', plural: 'colheres de sopa' },
  colher_cha: { singular: 'colher de chá', plural: 'colheres de chá' },
  pitada: { singular: 'pitada', plural: 'pitadas' },
  a_gosto: { singular: 'a gosto', plural: 'a gosto' },
};

function roundToNearestQuarter(value: number): number {
  return Math.round(value / QUANTITY_ROUNDING_STEP) * QUANTITY_ROUNDING_STEP;
}

function formatNumber(value: number): string {
  const wholePart = Math.trunc(value);
  const fraction = Math.round((value - wholePart) * 4) / 4;

  if (fraction === 0) return `${wholePart}`;
  const glyph = FRACTION_GLYPHS[fraction];
  return wholePart === 0 ? glyph : `${wholePart} ${glyph}`;
}

function formatDisplayQuantity(quantity: number | null, unit: IngredientUnit): string {
  if (unit === 'a_gosto' || quantity === null) return 'a gosto';

  const rounded = roundToNearestQuarter(quantity);
  const label = rounded === 1 ? UNIT_LABELS[unit].singular : UNIT_LABELS[unit].plural;
  return `${formatNumber(rounded)} ${label}`;
}

export function scaleIngredients(
  ingredients: RecipeIngredientDto[],
  baseServings: number,
  targetServings: number,
): ScaledIngredient[] {
  const ratio = targetServings / baseServings;

  return ingredients.map((ingredient) => {
    if (ingredient.unit === 'a_gosto') {
      return { name: ingredient.name, displayQuantity: 'a gosto' };
    }

    const isNonScalableUnit = NON_SCALABLE_UNITS.includes(ingredient.unit);
    const shouldScale = ingredient.scalesWithServings && !isNonScalableUnit;
    const quantity = ingredient.quantity ?? 0;
    const scaledQuantity = shouldScale ? quantity * ratio : quantity;

    return {
      name: ingredient.name,
      displayQuantity: formatDisplayQuantity(scaledQuantity, ingredient.unit),
    };
  });
}
