import { mapSpoonacularRecipe } from './recipe-import.mapper';
import { SpoonacularRecipe } from './spoonacular.types';

function recipeFixture(
  overrides: Partial<SpoonacularRecipe> = {},
): SpoonacularRecipe {
  return {
    id: 661430,
    title: 'Vegan Lentil Soup',
    image: 'https://example.com/soup.jpg',
    readyInMinutes: 30,
    servings: 4,
    summary: '<b>A hearty</b> vegan soup.<br>Ready in no time.',
    dishTypes: ['soup', 'main course'],
    extendedIngredients: [
      { name: 'lentils', amount: 200, unit: 'grams' },
      { name: 'carrot', amount: 2, unit: 'unrecognized-unit' },
    ],
    analyzedInstructions: [
      {
        steps: [
          { number: 1, step: 'Chop the vegetables.' },
          { number: 2, step: 'Simmer for 20 minutes.' },
        ],
      },
    ],
    nutrition: { calories: 350 },
    ...overrides,
  };
}

describe('mapSpoonacularRecipe', () => {
  it('maps a well-formed recipe into the internal shape', () => {
    const mapped = mapSpoonacularRecipe(recipeFixture());

    expect(mapped).not.toBeNull();
    expect(mapped?.externalSourceId).toBe('spoonacular:661430');
    expect(mapped?.description).toBe('A hearty vegan soup. Ready in no time.');
    expect(mapped?.category).toBe('almoco_jantar');
    expect(mapped?.difficulty).toBe('intermediario');
    expect(mapped?.ingredients).toEqual([
      {
        name: 'lentils',
        quantity: 200,
        unit: 'g',
        scalesWithServings: true,
        order: 1,
      },
      {
        name: 'carrot',
        quantity: 2,
        unit: 'unidade',
        scalesWithServings: true,
        order: 2,
      },
    ]);
    expect(mapped?.steps).toEqual([
      { order: 1, description: 'Chop the vegetables.', stepTimeSeconds: null },
      {
        order: 2,
        description: 'Simmer for 20 minutes.',
        stepTimeSeconds: null,
      },
    ]);
    expect(mapped?.externalNutritionData).toEqual({ calories: 350 });
  });

  it('stores null when the provider returned no nutrition data', () => {
    const mapped = mapSpoonacularRecipe(
      recipeFixture({ nutrition: undefined }),
    );
    expect(mapped?.externalNutritionData).toBeNull();
  });

  it.each([
    ['tbs', 'colher_sopa'],
    ['tbsps', 'colher_sopa'],
    ['tsps', 'colher_cha'],
    ['t', 'colher_cha'],
    ['c', 'xicara'],
    ['dashes', 'pitada'],
    ['small pinch', 'pitada'],
  ])('maps the abbreviation "%s" to %s', (upstreamUnit, expectedUnit) => {
    const mapped = mapSpoonacularRecipe(
      recipeFixture({
        extendedIngredients: [{ name: 'salt', amount: 1, unit: upstreamUnit }],
      }),
    );

    expect(mapped?.ingredients[0].unit).toBe(expectedUnit);
    expect(mapped?.ingredients[0].quantity).toBe(1);
  });

  it.each([
    ['oz', 8, 227],
    ['ounces', 4, 113],
    ['lb', 1, 454],
    ['pounds', 2, 907],
  ])(
    'converts %s to grams instead of falling back to unidade',
    (upstreamUnit, amount, expectedQuantity) => {
      const mapped = mapSpoonacularRecipe(
        recipeFixture({
          extendedIngredients: [{ name: 'tofu', amount, unit: upstreamUnit }],
        }),
      );

      expect(mapped?.ingredients[0].unit).toBe('g');
      expect(mapped?.ingredients[0].quantity).toBe(expectedQuantity);
    },
  );

  it('keeps countable upstream units as unidade without converting', () => {
    const mapped = mapSpoonacularRecipe(
      recipeFixture({
        extendedIngredients: [
          { name: 'onion', amount: 2, unit: 'medium' },
          { name: 'garlic', amount: 3, unit: 'cloves' },
          { name: 'spinach', amount: 1, unit: '' },
        ],
      }),
    );

    expect(mapped?.ingredients.map((i) => [i.unit, i.quantity])).toEqual([
      ['unidade', 2],
      ['unidade', 3],
      ['unidade', 1],
    ]);
  });

  it('falls back to the default category when no dishType matches', () => {
    const mapped = mapSpoonacularRecipe(
      recipeFixture({ dishTypes: ['unknown'] }),
    );
    expect(mapped?.category).toBe('almoco_jantar');
  });

  it('derives iniciante for quick recipes', () => {
    const mapped = mapSpoonacularRecipe(recipeFixture({ readyInMinutes: 15 }));
    expect(mapped?.difficulty).toBe('iniciante');
  });

  it('derives avancado for long recipes', () => {
    const mapped = mapSpoonacularRecipe(recipeFixture({ readyInMinutes: 90 }));
    expect(mapped?.difficulty).toBe('avancado');
  });

  it('returns null when the recipe has no ingredients', () => {
    const mapped = mapSpoonacularRecipe(
      recipeFixture({ extendedIngredients: [] }),
    );
    expect(mapped).toBeNull();
  });

  it('returns null when the recipe has no steps', () => {
    const mapped = mapSpoonacularRecipe(
      recipeFixture({ analyzedInstructions: [] }),
    );
    expect(mapped).toBeNull();
  });
});
