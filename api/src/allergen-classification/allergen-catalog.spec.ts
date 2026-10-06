import { AllergenClassificationService } from './allergen-classification.service';
import {
  ALLERGEN_INGREDIENT_TERMS,
  APPROVED_ALLERGENS,
} from './allergen-catalog';

const classifier = new AllergenClassificationService();

const normalizedTermsByAllergen = new Map<string, Set<string>>(
  Object.entries(ALLERGEN_INGREDIENT_TERMS).map(([allergen, terms]) => [
    allergen,
    new Set(terms.map((term) => classifier.normalizeIngredientName(term))),
  ]),
);

function allergensFor(ingredientName: string): string[] {
  const normalized = classifier.normalizeIngredientName(ingredientName);
  return [...normalizedTermsByAllergen.entries()]
    .filter(([, terms]) => terms.has(normalized))
    .map(([allergen]) => allergen);
}

describe('allergen catalog', () => {
  it('declares a term list for every approved allergen', () => {
    for (const allergen of APPROVED_ALLERGENS) {
      expect(ALLERGEN_INGREDIENT_TERMS[allergen]).toBeDefined();
    }
  });

  it('has no term assigned to more than one allergen', () => {
    const seen = new Map<string, string>();
    for (const [allergen, terms] of normalizedTermsByAllergen) {
      for (const term of terms) {
        expect(seen.get(term) ?? allergen).toBe(allergen);
        seen.set(term, allergen);
      }
    }
  });

  describe('detects the ingredients imported recipes actually use', () => {
    it.each([
      ['molho de soja', 'Soja'],
      ['tofu', 'Soja'],
      ['edamame', 'Soja'],
      ['sementes de gergelim', 'Gergelim'],
      ['óleo de gergelim', 'Gergelim'],
      ['tahine', 'Gergelim'],
      ['tahini', 'Gergelim'],
      ['manteiga de amendoim', 'Amendoim'],
      ['pasta de amendoim', 'Amendoim'],
      ['castanhas de caju', 'Castanhas e Nozes'],
      ['amêndoas laminadas', 'Castanhas e Nozes'],
      ['farinha de amêndoas', 'Castanhas e Nozes'],
      ['nozes', 'Castanhas e Nozes'],
      ['farinha de trigo', 'Trigo (Glúten)'],
      ['farinha', 'Trigo (Glúten)'],
      ['farinha de rosca', 'Trigo (Glúten)'],
      ['macarrão', 'Trigo (Glúten)'],
      ['macarrão penne', 'Trigo (Glúten)'],
      ['cuscuz', 'Trigo (Glúten)'],
      ['cuscuz marroquino', 'Trigo (Glúten)'],
      ['seitan', 'Trigo (Glúten)'],
    ])('flags "%s" as %s', (ingredient, expectedAllergen) => {
      expect(allergensFor(ingredient)).toEqual([expectedAllergen]);
    });
  });

  /**
   * The exact-match rule exists so these cannot be flagged. If a change makes
   * any of them match, vegan recipes start carrying allergens they do not
   * contain — the regression ADR-001/ADR-002 was written to prevent.
   */
  describe('never flags plant-based or similarly-named ingredients', () => {
    it.each([
      'leite de coco',
      'creme de coco',
      'leite de aveia',
      'leite de arroz',
      'leite de cânhamo',
      'farinha de arroz',
      'farinha de grão-de-bico',
      'farinha de aveia',
      'berinjela',
      'berinjelas',
      'abóbora',
      'abobrinha',
      'manteiga vegetal',
      'manteiga vegana',
      'queijo vegano',
      'iogurte de coco',
      'maionese vegana',
      'aveia',
      'macarrão de arroz',
      'óleo de coco',
      'água',
    ])('does not flag "%s"', (ingredient) => {
      expect(allergensFor(ingredient)).toEqual([]);
    });
  });
});
