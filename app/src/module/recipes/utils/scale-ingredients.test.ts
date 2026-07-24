import { describe, expect, it } from '@jest/globals';

import { scaleIngredients, type RecipeIngredientDto } from './scale-ingredients';

function buildIngredient(overrides: Partial<RecipeIngredientDto>): RecipeIngredientDto {
  return {
    name: 'Farinha de trigo',
    quantity: 2,
    unit: 'xicara',
    scalesWithServings: true,
    ...overrides,
  };
}

describe('scaleIngredients', () => {
  it('UT-001: scales a scalable ingredient linearly with the servings ratio', () => {
    const ingredients = [buildIngredient({ name: 'Farinha', quantity: 2, unit: 'xicara' })];

    const result = scaleIngredients(ingredients, 4, 6);

    expect(result).toEqual([{ name: 'Farinha', displayQuantity: '3 xícaras' }]);
  });

  it('UT-002: keeps a non-scalable ingredient fixed regardless of target servings', () => {
    const ingredients = [
      buildIngredient({ name: 'Sal', quantity: 1, unit: 'colher_cha', scalesWithServings: false }),
    ];

    const result = scaleIngredients(ingredients, 4, 12);

    expect(result).toEqual([{ name: 'Sal', displayQuantity: '1 colher de chá' }]);
  });

  it('UT-003: an a_gosto ingredient always displays "a gosto", even if scalesWithServings is true', () => {
    const ingredients = [
      buildIngredient({ name: 'Pimenta', quantity: null, unit: 'a_gosto', scalesWithServings: true }),
    ];

    const result = scaleIngredients(ingredients, 4, 8);

    expect(result).toEqual([{ name: 'Pimenta', displayQuantity: 'a gosto' }]);
  });

  it('UT-004: a pitada ingredient stays fixed regardless of target servings', () => {
    const ingredients = [
      buildIngredient({ name: 'Louro em pó', quantity: 1, unit: 'pitada', scalesWithServings: true }),
    ];

    const result = scaleIngredients(ingredients, 4, 10);

    expect(result).toEqual([{ name: 'Louro em pó', displayQuantity: '1 pitada' }]);
  });

  it('UT-005: returns unscaled original values when targetServings === baseServings', () => {
    const ingredients = [
      buildIngredient({ name: 'Farinha', quantity: 2, unit: 'xicara', scalesWithServings: true }),
      buildIngredient({ name: 'Sal', quantity: 1, unit: 'colher_cha', scalesWithServings: false }),
    ];

    const result = scaleIngredients(ingredients, 4, 4);

    expect(result).toEqual([
      { name: 'Farinha', displayQuantity: '2 xícaras' },
      { name: 'Sal', displayQuantity: '1 colher de chá' },
    ]);
  });

  it('never renders a raw floating-point value, rounding to the nearest quarter instead', () => {
    const ingredients = [buildIngredient({ name: 'Água', quantity: 1, unit: 'unidade' })];

    const result = scaleIngredients(ingredients, 3, 4);

    expect(result[0].displayQuantity).toBe('1 ¼ unidades');
  });
});
