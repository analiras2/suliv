import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/supabase-jwt.strategy';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoritesQueryDto } from './dto/favorites-query.dto';
import { FavoritesService, PaginatedFavorites } from './favorites.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @UseGuards(SupabaseAuthGuard)
  list(
    @Query() query: FavoritesQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PaginatedFavorites> {
    return this.favoritesService.list(request.user.id, query.cursor);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  async add(
    @Body() body: CreateFavoriteDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ ok: true }> {
    await this.favoritesService.add(
      request.user.id,
      body.recipe_id,
      body.idempotency_key,
    );
    return { ok: true };
  }

  @Delete(':recipe_id')
  @UseGuards(SupabaseAuthGuard)
  async remove(
    @Param('recipe_id') recipeId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ ok: true }> {
    await this.favoritesService.remove(request.user.id, recipeId);
    return { ok: true };
  }
}
