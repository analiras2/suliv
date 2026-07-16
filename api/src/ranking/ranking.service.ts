import { Injectable, NotFoundException } from '@nestjs/common';
import { DietPreference, RecipeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeSummaryDto } from '../recipes/recipe-summary.dto';

const DIET_COMPATIBILITY: Record<DietPreference, DietPreference[]> = {
  [DietPreference.vegano]: [DietPreference.vegano],
  [DietPreference.vegetariano]: [
    DietPreference.vegano,
    DietPreference.vegetariano,
  ],
  [DietPreference.flexitariano]: [
    DietPreference.vegano,
    DietPreference.vegetariano,
    DietPreference.flexitariano,
  ],
};

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  async getSelectedForYou(
    userId: string,
    limit: number,
  ): Promise<RecipeSummaryDto[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const dietPreference = user.dietPreference
      ? { in: DIET_COMPATIBILITY[user.dietPreference] }
      : undefined;

    const recipes = await this.prisma.recipe.findMany({
      where: { status: RecipeStatus.aprovada, dietPreference },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return recipes.map((recipe) => RecipeSummaryDto.fromRecipe(recipe));
  }
}
