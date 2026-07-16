import { Injectable, Logger } from '@nestjs/common';
import { Category } from '@prisma/client';
import { RankingService } from '../ranking/ranking.service';
import { RecipeSummaryDto } from '../recipes/recipe-summary.dto';
import { RecipesService } from '../recipes/recipes.service';

const SELECTED_FOR_YOU_LIMIT = 5;
const TOP_OF_WEEK_LIMIT = 5;
const CATEGORY_RECIPES_LIMIT = 4;

export interface CategoryBlockDto {
  category: Category;
  recipes: RecipeSummaryDto[];
}

export interface FeedResponseDto {
  selectedForYou: RecipeSummaryDto[];
  categories: CategoryBlockDto[];
  topOfWeek: RecipeSummaryDto[];
}

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    private readonly recipesService: RecipesService,
    private readonly rankingService: RankingService,
  ) {}

  async getFeed(userId: string): Promise<FeedResponseDto> {
    const startedAt = Date.now();
    const [selectedForYou, categories, topOfWeek] = await Promise.all([
      this.rankingService.getSelectedForYou(userId, SELECTED_FOR_YOU_LIMIT),
      this.getCategoryBlocks(),
      this.recipesService.listTopOfWeek(TOP_OF_WEEK_LIMIT),
    ]);

    this.logger.log(
      { userId, latencyMs: Date.now() - startedAt },
      'FeedAssembled',
    );

    return { selectedForYou, categories, topOfWeek };
  }

  getCategories(): Promise<Category[]> {
    return this.recipesService.listCategories();
  }

  private async getCategoryBlocks(): Promise<CategoryBlockDto[]> {
    const categories = await this.recipesService.listCategories();
    return Promise.all(
      categories.map(async (category) => ({
        category,
        recipes: await this.recipesService.listByCategory(
          category.id,
          CATEGORY_RECIPES_LIMIT,
        ),
      })),
    );
  }
}
