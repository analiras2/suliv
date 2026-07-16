import { Injectable } from '@nestjs/common';
import { Category, RecipeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeSummaryDto } from './recipe-summary.dto';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async listByCategory(
    categoryId: string,
    limit: number,
  ): Promise<RecipeSummaryDto[]> {
    const recipes = await this.prisma.recipe.findMany({
      where: { categoryId, status: RecipeStatus.aprovada },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return recipes.map((recipe) => RecipeSummaryDto.fromRecipe(recipe));
  }

  async listTopOfWeek(limit: number): Promise<RecipeSummaryDto[]> {
    const recipes = await this.prisma.recipe.findMany({
      where: { status: RecipeStatus.aprovada },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return recipes.map((recipe) => RecipeSummaryDto.fromRecipe(recipe));
  }

  listCategories(): Promise<Category[]> {
    return this.prisma.category.findMany({ orderBy: { label: 'asc' } });
  }
}
