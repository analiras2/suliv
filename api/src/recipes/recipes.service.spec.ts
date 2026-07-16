import { Category, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PopularityService } from '../ranking/popularity.service';
import { RecipeSummaryDto } from './recipe-summary.dto';
import { RecipesService } from './recipes.service';

const category: Category = {
  id: 'category-1',
  key: 'almoco_jantar',
  label: 'Almoço/Jantar',
} as Category;

function recipeSummaryFixture(id: string): RecipeSummaryDto {
  return {
    id,
    slug: id,
    title: id,
    coverImageUrl: null,
    category,
    timeBucket: 'quinze_30',
    difficulty: 'iniciante',
    dietPreference: 'flexitariano',
  } as RecipeSummaryDto;
}

describe('RecipesService', () => {
  const findManyCategory = jest.fn<
    Promise<Category[]>,
    [Prisma.CategoryFindManyArgs]
  >();
  const getTopOfWeek = jest.fn<Promise<RecipeSummaryDto[]>, [number]>();
  const getTopOfWeekByCategory = jest.fn<
    Promise<RecipeSummaryDto[]>,
    [string, number]
  >();
  const prisma = { category: { findMany: findManyCategory } };
  const popularityService = { getTopOfWeek, getTopOfWeekByCategory };
  let service: RecipesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RecipesService(
      prisma as unknown as PrismaService,
      popularityService as unknown as PopularityService,
    );
  });

  it('UT-005 listByCategory delegates to PopularityService.getTopOfWeekByCategory with categoryId and limit', async () => {
    const summaries = [recipeSummaryFixture('recipe-1')];
    getTopOfWeekByCategory.mockResolvedValue(summaries);

    const result = await service.listByCategory('category-1', 3);

    expect(result).toBe(summaries);
    expect(getTopOfWeekByCategory).toHaveBeenCalledWith('category-1', 3);
  });

  it('UT-006 listTopOfWeek delegates to PopularityService.getTopOfWeek with limit', async () => {
    const summaries = [recipeSummaryFixture('recipe-1')];
    getTopOfWeek.mockResolvedValue(summaries);

    const result = await service.listTopOfWeek(5);

    expect(result).toBe(summaries);
    expect(getTopOfWeek).toHaveBeenCalledWith(5);
  });

  it('listCategories returns all seeded categories', async () => {
    const categories = [category];
    findManyCategory.mockResolvedValue(categories);

    await expect(service.listCategories()).resolves.toEqual(categories);
    expect(findManyCategory).toHaveBeenCalled();
  });
});
