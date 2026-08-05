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

const UNIT_ALIASES: Record<string, IngredientUnit> = {
  g: IngredientUnit.g,
  gram: IngredientUnit.g,
  grams: IngredientUnit.g,
  kg: IngredientUnit.kg,
  kilogram: IngredientUnit.kg,
  kilograms: IngredientUnit.kg,
  ml: IngredientUnit.ml,
  milliliter: IngredientUnit.ml,
  milliliters: IngredientUnit.ml,
  l: IngredientUnit.l,
  liter: IngredientUnit.l,
  liters: IngredientUnit.l,
  cup: IngredientUnit.xicara,
  cups: IngredientUnit.xicara,
  tablespoon: IngredientUnit.colher_sopa,
  tablespoons: IngredientUnit.colher_sopa,
  tbsp: IngredientUnit.colher_sopa,
  teaspoon: IngredientUnit.colher_cha,
  teaspoons: IngredientUnit.colher_cha,
  tsp: IngredientUnit.colher_cha,
  pinch: IngredientUnit.pitada,
  pinches: IngredientUnit.pitada,
};

const DEFAULT_UNIT = IngredientUnit.unidade;

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

function mapUnit(unit: string): IngredientUnit {
  const normalized = unit.trim().toLowerCase();
  return UNIT_ALIASES[normalized] ?? DEFAULT_UNIT;
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
  const ingredients = recipe.extendedIngredients.map((ingredient, index) => ({
    name: ingredient.name,
    quantity: ingredient.amount,
    unit: mapUnit(ingredient.unit),
    scalesWithServings: true,
    order: index + 1,
  }));

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
