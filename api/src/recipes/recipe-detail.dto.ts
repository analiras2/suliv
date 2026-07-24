import {
  Category,
  IngredientUnit,
  Recipe,
  RecipeIngredient,
  RecipeStep,
} from '@prisma/client';
import { RecipeSummaryDto } from './recipe-summary.dto';

export class RecipeIngredientDto {
  name!: string;
  quantity!: number | null;
  unit!: IngredientUnit;
  scalesWithServings!: boolean;

  static fromIngredient(ingredient: RecipeIngredient): RecipeIngredientDto {
    return {
      name: ingredient.name,
      quantity:
        ingredient.quantity === null ? null : Number(ingredient.quantity),
      unit: ingredient.unit,
      scalesWithServings: ingredient.scalesWithServings,
    };
  }
}

export class RecipeStepDto {
  order!: number;
  description!: string;
  stepTimeSeconds!: number | null;

  static fromStep(step: RecipeStep): RecipeStepDto {
    return {
      order: step.order,
      description: step.description,
      stepTimeSeconds: step.stepTimeSeconds,
    };
  }
}

export type RecipeWithDetails = Recipe & {
  category: Category;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
};

export class RecipeDetailDto extends RecipeSummaryDto {
  description!: string;
  servings!: number;
  ingredients!: RecipeIngredientDto[];
  steps!: RecipeStepDto[];
  conflictsWithUser?: boolean;
  conflictingAllergens?: string[];
  isFavorited?: boolean;
  averageRating!: number | null;
  ratingCount!: number;

  static fromRecipe(
    recipe: RecipeWithDetails,
    aggregate: { averageRating: number | null; ratingCount: number } = {
      averageRating: null,
      ratingCount: 0,
    },
  ): RecipeDetailDto {
    return {
      ...RecipeSummaryDto.fromRecipe(recipe),
      description: recipe.description,
      servings: recipe.servings,
      ingredients: recipe.ingredients
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((ingredient) => RecipeIngredientDto.fromIngredient(ingredient)),
      steps: recipe.steps
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((step) => RecipeStepDto.fromStep(step)),
      averageRating: aggregate.averageRating,
      ratingCount: aggregate.ratingCount,
    };
  }
}
