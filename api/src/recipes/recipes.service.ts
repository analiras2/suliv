import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PopularityService } from '../ranking/popularity.service';
import { RecipeSummaryDto } from './recipe-summary.dto';

@Injectable()
export class RecipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly popularityService: PopularityService,
  ) {}

  listByCategory(categoryId: string, limit: number): Promise<RecipeSummaryDto[]> {
    return this.popularityService.getTopOfWeekByCategory(categoryId, limit);
  }

  listTopOfWeek(limit: number): Promise<RecipeSummaryDto[]> {
    return this.popularityService.getTopOfWeek(limit);
  }

  listCategories(): Promise<Category[]> {
    return this.prisma.category.findMany({ orderBy: { label: 'asc' } });
  }
}
