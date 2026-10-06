import {
  CookingLevel,
  IngredientUnit,
  Prisma,
  RecipeCategory,
} from '@prisma/client';
import { SpoonacularRecipe } from './spoonacular.types';

const EASY_RECIPE_MAX_MINUTES = 20;
const MEDIUM_RECIPE_MAX_MINUTES = 45;

const DISH_TYPE_TO_CATEGORY: Record<string, RecipeCategory> = {
  breakfast: RecipeCategory.cafe_da_manha,
  brunch: RecipeCategory.cafe_da_manha,
  'main course': RecipeCategory.almoco_jantar,
  'main dish': RecipeCategory.almoco_jantar,
  lunch: RecipeCategory.almoco_jantar,
  dinner: RecipeCategory.almoco_jantar,
  soup: RecipeCategory.almoco_jantar,
  salad: RecipeCategory.almoco_jantar,
  'side dish': RecipeCategory.lanche,
  appetizer: RecipeCategory.lanche,
  snack: RecipeCategory.lanche,
  fingerfood: RecipeCategory.lanche,
  dessert: RecipeCategory.sobremesa,
  beverage: RecipeCategory.bebida,
  drink: RecipeCategory.bebida,
  cocktail: RecipeCategory.bebida,
  sauce: RecipeCategory.molhos_acompanhamentos,
  condiment: RecipeCategory.molhos_acompanhamentos,
  marinade: RecipeCategory.molhos_acompanhamentos,
};

const DEFAULT_CATEGORY = RecipeCategory.almoco_jantar;

// IngredientUnit has no imperial weights, so those are converted instead of
// falling back to `unidade` — "8 oz" must not become "8 unidade".
const GRAMS_PER_OUNCE = 28.35;
const GRAMS_PER_POUND = 453.59;

interface UnitMapping {
  unit: IngredientUnit;
  // Multiplies the provider's amount. Set only where the upstream unit has
  // no equivalent in IngredientUnit and the quantity must be converted.
  factor?: number;
}

const UNIT_ALIASES: Record<string, UnitMapping> = {
  g: { unit: IngredientUnit.g },
  gram: { unit: IngredientUnit.g },
  grams: { unit: IngredientUnit.g },
  kg: { unit: IngredientUnit.kg },
  kilogram: { unit: IngredientUnit.kg },
  kilograms: { unit: IngredientUnit.kg },
  ml: { unit: IngredientUnit.ml },
  milliliter: { unit: IngredientUnit.ml },
  milliliters: { unit: IngredientUnit.ml },
  l: { unit: IngredientUnit.l },
  liter: { unit: IngredientUnit.l },
  liters: { unit: IngredientUnit.l },
  cup: { unit: IngredientUnit.xicara },
  cups: { unit: IngredientUnit.xicara },
  // Spoonacular's abbreviation for cup.
  c: { unit: IngredientUnit.xicara },
  tablespoon: { unit: IngredientUnit.colher_sopa },
  tablespoons: { unit: IngredientUnit.colher_sopa },
  tbsp: { unit: IngredientUnit.colher_sopa },
  tbsps: { unit: IngredientUnit.colher_sopa },
  tbs: { unit: IngredientUnit.colher_sopa },
  teaspoon: { unit: IngredientUnit.colher_cha },
  teaspoons: { unit: IngredientUnit.colher_cha },
  tsp: { unit: IngredientUnit.colher_cha },
  tsps: { unit: IngredientUnit.colher_cha },
  // Culinary convention is lowercase "t" for teaspoon (uppercase "T" being
  // tablespoon), but units are matched case-insensitively — so an upstream
  // "T" lands here too. Teaspoon is the far more common of the two.
  t: { unit: IngredientUnit.colher_cha },
  pinch: { unit: IngredientUnit.pitada },
  pinches: { unit: IngredientUnit.pitada },
  'small pinch': { unit: IngredientUnit.pitada },
  dash: { unit: IngredientUnit.pitada },
  dashes: { unit: IngredientUnit.pitada },
  oz: { unit: IngredientUnit.g, factor: GRAMS_PER_OUNCE },
  ounce: { unit: IngredientUnit.g, factor: GRAMS_PER_OUNCE },
  ounces: { unit: IngredientUnit.g, factor: GRAMS_PER_OUNCE },
  lb: { unit: IngredientUnit.g, factor: GRAMS_PER_POUND },
  lbs: { unit: IngredientUnit.g, factor: GRAMS_PER_POUND },
  pound: { unit: IngredientUnit.g, factor: GRAMS_PER_POUND },
  pounds: { unit: IngredientUnit.g, factor: GRAMS_PER_POUND },
};

// Everything else — "medium", "clove", "bunch", "can", or an empty unit — is
// a countable item, which `unidade` represents correctly.
const DEFAULT_UNIT: UnitMapping = { unit: IngredientUnit.unidade };

export interface MappedIngredient {
  name: string;
  quantity: number | null;
  unit: IngredientUnit;
  scalesWithServings: boolean;
  order: number;
}

export interface MappedStep {
  order: number;
  description: string;
  stepTimeSeconds: null;
}

export interface MappedRecipe {
  externalSourceId: string;
  title: string;
  description: string;
  category: RecipeCategory;
  prepTimeMinutes: number;
  servings: number;
  difficulty: CookingLevel;
  coverImageUrl: string | null;
  ingredients: MappedIngredient[];
  steps: MappedStep[];
  externalNutritionData: Prisma.InputJsonValue | null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapCategory(dishTypes: string[]): RecipeCategory {
  const match = dishTypes
    .map((dishType) => dishType.toLowerCase())
    .find((dishType) => dishType in DISH_TYPE_TO_CATEGORY);
  return match ? DISH_TYPE_TO_CATEGORY[match] : DEFAULT_CATEGORY;
}

function mapUnit(unit: string): UnitMapping {
  const normalized = unit.trim().toLowerCase();
  return UNIT_ALIASES[normalized] ?? DEFAULT_UNIT;
}

// Converted quantities are rounded: a recipe asking for "227 g" of tofu is
// more useful to a cook than "226.8 g".
function convertQuantity(amount: number, mapping: UnitMapping): number {
  if (mapping.factor === undefined) {
    return amount;
  }
  return Math.round(amount * mapping.factor);
}

// Spoonacular has no difficulty field; readyInMinutes is the closest signal
// the API exposes, so it's used as a rough proxy until a better one exists.
function deriveDifficulty(readyInMinutes: number): CookingLevel {
  if (readyInMinutes <= EASY_RECIPE_MAX_MINUTES) {
    return CookingLevel.iniciante;
  }
  if (readyInMinutes <= MEDIUM_RECIPE_MAX_MINUTES) {
    return CookingLevel.intermediario;
  }
  return CookingLevel.avancado;
}

export function mapSpoonacularRecipe(
  recipe: SpoonacularRecipe,
): MappedRecipe | null {
  const ingredients: MappedIngredient[] = recipe.extendedIngredients.map(
    (ingredient, index) => {
      const mapping = mapUnit(ingredient.unit);
      return {
        name: ingredient.name,
        quantity: convertQuantity(ingredient.amount, mapping),
        unit: mapping.unit,
        scalesWithServings: true,
        order: index + 1,
      };
    },
  );

  const steps: MappedStep[] = (recipe.analyzedInstructions[0]?.steps ?? []).map(
    (step) => ({
      order: step.number,
      description: step.step,
      stepTimeSeconds: null,
    }),
  );

  if (ingredients.length === 0 || steps.length === 0) {
    return null;
  }

  return {
    externalSourceId: `spoonacular:${recipe.id}`,
    title: recipe.title,
    description: recipe.summary ? stripHtml(recipe.summary) : recipe.title,
    category: mapCategory(recipe.dishTypes),
    prepTimeMinutes: recipe.readyInMinutes,
    servings: recipe.servings,
    difficulty: deriveDifficulty(recipe.readyInMinutes),
    coverImageUrl: recipe.image ?? null,
    ingredients,
    steps,
    externalNutritionData: recipe.nutrition ? recipe.nutrition : null,
  };
}
