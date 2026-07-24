import { Category, Recipe, RecipeStatus } from '@prisma/client';
import { RecipeSummaryDto } from './recipe-summary.dto';

export class MyRecipeSummaryDto extends RecipeSummaryDto {
  status!: RecipeStatus;

  static fromRecipe(
    recipe: Recipe & { category: Category },
  ): MyRecipeSummaryDto {
    return {
      ...RecipeSummaryDto.fromRecipe(recipe),
      status: recipe.status,
    };
  }
}
