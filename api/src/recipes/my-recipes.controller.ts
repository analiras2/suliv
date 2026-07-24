import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { AuthenticatedUser } from '../auth/supabase-jwt.strategy';
import { ListMineQueryDto } from './dto';
import { PaginatedMyRecipes, RecipesService } from './recipes.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('me/recipes')
@UseGuards(SupabaseAuthGuard)
export class MyRecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  listMine(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListMineQueryDto,
  ): Promise<PaginatedMyRecipes> {
    return this.recipesService.listMine(
      request.user.id,
      query.status,
      query.cursor,
    );
  }
}
