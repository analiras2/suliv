import {
  Category,
  CookingLevel,
  DietPreference,
  Recipe,
  TimeBucket,
} from '@prisma/client';

export class RecipeSummaryDto {
  id!: string;
  slug!: string;
  title!: string;
  coverImageUrl!: string | null;
  category!: Category;
  timeBucket!: TimeBucket;
  difficulty!: CookingLevel;
  dietPreference!: DietPreference;

  static fromRecipe(recipe: Recipe & { category: Category }): RecipeSummaryDto {
    return {
      id: recipe.id,
      slug: recipe.slug,
      title: recipe.title,
      coverImageUrl: recipe.coverImageUrl,
      category: recipe.category,
      timeBucket: recipe.timeBucket,
      difficulty: recipe.difficulty,
      dietPreference: recipe.dietPreference,
    };
  }
}
