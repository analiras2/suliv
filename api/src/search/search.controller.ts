import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/supabase-jwt.strategy';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { PaginatedRecipes } from '../ranking/paginated-recipes.dto';
import { SearchRecipesQueryDto } from './dto/search-recipes-query.dto';
import { ListingFilters, ListingOrigin, SearchService } from './search.service';

const DEFAULT_ORIGIN: ListingOrigin = 'busca';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('recipes')
@UseGuards(SupabaseAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('search')
  search(
    @Req() request: AuthenticatedRequest,
    @Query() query: SearchRecipesQueryDto,
  ): Promise<PaginatedRecipes> {
    const filters: ListingFilters = {
      q: query.q,
      category: query.category,
      time: query.time,
      difficulty: query.difficulty,
      diet: query.diet,
      allergens: query.allergens
        ? Array.isArray(query.allergens)
          ? query.allergens
          : [query.allergens]
        : undefined,
    };

    return this.searchService.search(
      request.user.id,
      query.origin ?? DEFAULT_ORIGIN,
      filters,
      query.cursor,
    );
  }
}
