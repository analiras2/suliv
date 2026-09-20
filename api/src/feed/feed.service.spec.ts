import { Category, RecipeCategory } from '@prisma/client';
import { RankingService } from '../ranking/ranking.service';
import { RecipeSummaryDto } from '../recipes/recipe-summary.dto';
import { RecipesService } from '../recipes/recipes.service';
import { FeedService } from './feed.service';

const categories: Category[] = [
  { id: 'cat-1', key: RecipeCategory.cafe_da_manha, label: 'Café da manhã' },
  { id: 'cat-2', key: RecipeCategory.almoco_jantar, label: 'Almoço/Jantar' },
];

function recipeSummaryFixture(id: string): RecipeSummaryDto {
  return {
    id,
    slug: id,
    title: id,
    coverImageUrl: null,
    category: categories[0],
    timeBucket: 'ate_15',
    difficulty: 'iniciante',
    dietPreference: 'flexitariano',
  };
}

describe('FeedService', () => {
  const getSelectedForYou = jest.fn<
    Promise<RecipeSummaryDto[]>,
    [string, number]
  >();
  const listByCategory = jest.fn<
    Promise<RecipeSummaryDto[]>,
    [string, number]
  >();
  const listTopOfWeek = jest.fn<
    Promise<RecipeSummaryDto[]>,
    [number, string | undefined]
  >();
  const listCategories = jest.fn<Promise<Category[]>, []>();
  const countApprovedRecipes = jest.fn<Promise<number>, []>();

  let service: FeedService;

  beforeEach(() => {
    jest.clearAllMocks();
    const recipesService = {
      listByCategory,
      listTopOfWeek,
      listCategories,
      countApprovedRecipes,
    } as unknown as RecipesService;
    const rankingService = {
      getSelectedForYou,
    } as unknown as RankingService;
    service = new FeedService(recipesService, rankingService);
  });

  it('assembles the 3 feed blocks in parallel', async () => {
    let selectedForYouStarted = false;
    let categoriesStarted = false;
    let topOfWeekStarted = false;
    let countApprovedRecipesStarted = false;

    getSelectedForYou.mockImplementation(() => {
      selectedForYouStarted = true;
      return Promise.resolve([recipeSummaryFixture('selected-1')]);
    });
    listCategories.mockImplementation(() => {
      categoriesStarted = true;
      return Promise.resolve(categories);
    });
    listByCategory.mockResolvedValue([recipeSummaryFixture('cat-recipe')]);
    listTopOfWeek.mockImplementation(() => {
      topOfWeekStarted = true;
      return Promise.resolve([recipeSummaryFixture('top-1')]);
    });
    countApprovedRecipes.mockImplementation(() => {
      countApprovedRecipesStarted = true;
      return Promise.resolve(1);
    });

    const result = await service.getFeed('user-1');

    expect(selectedForYouStarted).toBe(true);
    expect(categoriesStarted).toBe(true);
    expect(topOfWeekStarted).toBe(true);
    expect(countApprovedRecipesStarted).toBe(true);
    expect(getSelectedForYou).toHaveBeenCalledWith('user-1', 5);
    expect(listTopOfWeek).toHaveBeenCalledWith(5, 'user-1');
    expect(result.selectedForYou).toHaveLength(1);
    expect(result.categories).toEqual([
      {
        category: categories[0],
        recipes: [recipeSummaryFixture('cat-recipe')],
      },
      {
        category: categories[1],
        recipes: [recipeSummaryFixture('cat-recipe')],
      },
    ]);
    expect(result.topOfWeek).toHaveLength(1);
    expect(result.catalogEmpty).toBe(false);
  });

  it('UT-004 sets catalogEmpty true only when zero approved recipes exist, independent of block contents', async () => {
    getSelectedForYou.mockResolvedValue([]);
    listCategories.mockResolvedValue([]);
    listTopOfWeek.mockResolvedValue([]);
    countApprovedRecipes.mockResolvedValue(0);

    const zeroResult = await service.getFeed('user-1');
    expect(zeroResult.catalogEmpty).toBe(true);

    getSelectedForYou.mockResolvedValue([recipeSummaryFixture('selected-1')]);
    listCategories.mockResolvedValue(categories);
    listByCategory.mockResolvedValue([]);
    listTopOfWeek.mockResolvedValue([]);
    countApprovedRecipes.mockResolvedValue(1);

    const oneResult = await service.getFeed('user-1');
    expect(oneResult.catalogEmpty).toBe(false);
  });

  it('does not call ranking or recipe queries when only listing categories', async () => {
    listCategories.mockResolvedValue(categories);

    const result = await service.getCategories();

    expect(result).toEqual(categories);
    expect(getSelectedForYou).not.toHaveBeenCalled();
    expect(listByCategory).not.toHaveBeenCalled();
    expect(listTopOfWeek).not.toHaveBeenCalled();
  });
});
