import { AdjustmentReason, RecipeStatus } from '@prisma/client';
import {
  RecipeDetailDto,
  RecipeWithDetails,
} from '../../../recipes/recipe-detail.dto';

export class AdminRecipeDetailDto extends RecipeDetailDto {
  status!: RecipeStatus;
  authorMessageToModerator!: string | null;
  adjustmentReason!: AdjustmentReason | null;
  adjustmentNote!: string | null;

  static fromRecipe(
    recipe: RecipeWithDetails,
    aggregate: { averageRating: number | null; ratingCount: number },
  ): AdminRecipeDetailDto {
    return {
      ...RecipeDetailDto.fromRecipe(recipe, aggregate),
      status: recipe.status,
      authorMessageToModerator: recipe.authorMessageToModerator,
      adjustmentReason: recipe.adjustmentReason,
      adjustmentNote: recipe.adjustmentNote,
    };
  }
}
