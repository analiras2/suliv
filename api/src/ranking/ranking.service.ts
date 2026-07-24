import { Injectable, NotFoundException } from '@nestjs/common';
import { Category, Recipe, RecipeStatus, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecipeSummaryDto } from '../recipes/recipe-summary.dto';
import { isDietCompatible } from './diet-compatibility';
import { PaginatedRecipes } from './paginated-recipes.dto';
import { PopularityService } from './popularity.service';
import {
  calculateTotalScore,
  categoryPerformsWell,
  computeEditorialBoostWeight,
  computeMedian,
  computeTopNCutoff,
  hasAllergyConflict,
  isDifficultyCompatible,
  isPopularThisWeek,
  isRecentRecipe,
  isTimeCompatible,
  POPULAR_THIS_WEEK_TOP_N,
  ScoreSignals,
} from './score-signals';

type CandidateRecipe = Recipe & { category: Category };

interface ScoredCandidate {
  recipe: CandidateRecipe;
  score: number;
  signals: ScoreSignals;
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), 'utf8').toString('base64');
}

function decodeCursor(cursor: string): number {
  const offset = Number(Buffer.from(cursor, 'base64').toString('utf8'));
  return Number.isInteger(offset) && offset >= 0 ? offset : 0;
}

@Injectable()
export class RankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly popularityService: PopularityService,
  ) {}

  async getSelectedForYou(
    userId: string,
    limit: number,
  ): Promise<RecipeSummaryDto[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const scored = await this.computeScoredCandidates(user);
    if (scored.length === 0) {
      return [];
    }

    const eligibleFlags = await Promise.all(
      scored.map((entry) => this.popularityService.isEligible(entry.recipe.id)),
    );
    const eligibleScored = scored.filter(
      (_entry, index) => eligibleFlags[index],
    );

    const topScoredCount = Math.max(limit - 1, 0);
    const topScored = [...eligibleScored]
      .sort((a, b) => b.score - a.score)
      .slice(0, topScoredCount);

    const selectedIds = new Set(topScored.map((entry) => entry.recipe.id));
    const userDiet = user.dietPreference;

    const coldStartCandidate = scored
      .map((entry) => entry.recipe)
      .filter((recipe) => !selectedIds.has(recipe.id))
      .filter((recipe) =>
        userDiet ? isDietCompatible(recipe.dietPreference, userDiet) : true,
      )
      .sort(
        (a, b) =>
          (b.approvedAt?.getTime() ?? 0) - (a.approvedAt?.getTime() ?? 0),
      )[0];

    const finalRecipes: CandidateRecipe[] = topScored.map(
      (entry) => entry.recipe,
    );
    if (coldStartCandidate) {
      finalRecipes.push(coldStartCandidate);
    }

    return finalRecipes.map((recipe) => RecipeSummaryDto.fromRecipe(recipe));
  }

  /**
   * Cursor-stability limitation (TechSpec Known Risks): each call recomputes
   * scores fresh, and the cursor is a plain offset into that freshly sorted
   * list. If a recipe's score shifts between page loads (e.g.
   * `recipe_daily_stats` changes), the offset can point at a different
   * recipe than intended, causing a duplicate or a skipped item across
   * pages. Not engineered around for the MVP — acceptable at current
   * traffic/catalog scale, flagged for revisit if it becomes noticeable.
   */
  async getSelectedForYouPaginated(
    userId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<PaginatedRecipes> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const scored = await this.computeScoredCandidates(user);
    const ordered = [...scored].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.recipe.id.localeCompare(b.recipe.id);
    });

    const offset = cursor ? decodeCursor(cursor) : 0;
    const page = ordered.slice(offset, offset + limit);
    const nextOffset = offset + page.length;

    return {
      items: page.map((entry) => ({
        ...RecipeSummaryDto.fromRecipe(entry.recipe),
        conflictsWithUser:
          entry.signals.allergyConflict || !entry.signals.dietCompatible,
      })),
      nextCursor: nextOffset < ordered.length ? encodeCursor(nextOffset) : null,
    };
  }

  private async computeScoredCandidates(
    user: User,
  ): Promise<ScoredCandidate[]> {
    const [candidates, userAllergies] = await Promise.all([
      this.prisma.recipe.findMany({
        where: { status: RecipeStatus.aprovada },
        include: { category: true },
      }),
      this.prisma.userAllergy.findMany({ where: { userId: user.id } }),
    ]);

    if (candidates.length === 0) {
      return [];
    }

    const recipeIds = candidates.map((recipe) => recipe.id);
    const [recipeAllergens, editorialBoosts] = await Promise.all([
      this.prisma.recipeAllergen.findMany({
        where: { recipeId: { in: recipeIds } },
      }),
      this.prisma.editorialBoost.findMany({
        where: { recipeId: { in: recipeIds } },
      }),
    ]);

    const userAllergenIds = new Set(
      userAllergies.map((allergy) => allergy.allergenId),
    );
    const recipeAllergenMap = new Map<string, Set<string>>();
    for (const recipeAllergen of recipeAllergens) {
      const set =
        recipeAllergenMap.get(recipeAllergen.recipeId) ?? new Set<string>();
      set.add(recipeAllergen.allergenId);
      recipeAllergenMap.set(recipeAllergen.recipeId, set);
    }

    const now = new Date();
    const editorialBoostByRecipeId = new Map<
      string,
      { startsAt: Date; endsAt: Date; weight: number }
    >();
    for (const boost of editorialBoosts) {
      editorialBoostByRecipeId.set(boost.recipeId, boost);
    }

    const weeklyPopularityByRecipeId = new Map<string, number>();
    await Promise.all(
      candidates.map(async (recipe) => {
        weeklyPopularityByRecipeId.set(
          recipe.id,
          await this.popularityService.getWeeklyPopularity(recipe.id),
        );
      }),
    );
    const popularityCutoff = computeTopNCutoff(
      [...weeklyPopularityByRecipeId.values()],
      POPULAR_THIS_WEEK_TOP_N,
    );

    const categoryIds = [
      ...new Set(candidates.map((recipe) => recipe.categoryId)),
    ];
    const categoryAverageById = new Map<string, number>();
    await Promise.all(
      categoryIds.map(async (categoryId) => {
        categoryAverageById.set(
          categoryId,
          await this.popularityService.getCategoryAverage(categoryId),
        );
      }),
    );
    const crossCategoryMedian = computeMedian([
      ...categoryAverageById.values(),
    ]);

    const userDiet = user.dietPreference;

    return candidates.map((recipe) => {
      const signals: ScoreSignals = {
        dietCompatible: userDiet
          ? isDietCompatible(recipe.dietPreference, userDiet)
          : true,
        allergyConflict: hasAllergyConflict(
          recipeAllergenMap.get(recipe.id) ?? new Set<string>(),
          userAllergenIds,
        ),
        difficultyCompatible: isDifficultyCompatible(
          recipe.difficulty,
          user.cookingLevel,
        ),
        timeCompatible: isTimeCompatible(
          recipe.timeBucket,
          user.cookingFrequency,
        ),
        popularThisWeek: isPopularThisWeek(
          weeklyPopularityByRecipeId.get(recipe.id) ?? 0,
          popularityCutoff,
        ),
        isRecent: isRecentRecipe(recipe.approvedAt, now),
        categoryPerformsWell: categoryPerformsWell(
          categoryAverageById.get(recipe.categoryId) ?? 0,
          crossCategoryMedian,
        ),
        editorialBoostWeight: computeEditorialBoostWeight(
          editorialBoostByRecipeId.get(recipe.id) ?? null,
          now,
        ),
      };
      return { recipe, score: calculateTotalScore(signals), signals };
    });
  }
}
