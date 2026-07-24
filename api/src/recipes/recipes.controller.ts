import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Recipe } from '@prisma/client';
import { Request } from 'express';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { AuthenticatedUser } from '../auth/supabase-jwt.strategy';
import { CreateRecipeDto, UpdateRecipeDto } from './dto';
import { RecipeDetailDto } from './recipe-detail.dto';
import { RecipesService } from './recipes.service';

type OptionallyAuthenticatedRequest = Request & { user?: AuthenticatedUser };
type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  /**
   * The app's one route not requiring a JWT (ADR-002): recipe detail renders
   * for anonymous deep-link visitors, and additionally reflects the caller's
   * allergy warnings/favorite state when a valid session is present.
   */
  @Get(':slug')
  @UseGuards(OptionalAuthGuard)
  getBySlug(
    @Param('slug') slug: string,
    @Req() request: OptionallyAuthenticatedRequest,
  ): Promise<RecipeDetailDto> {
    return this.recipesService.getBySlug(slug, request.user?.id);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateRecipeDto,
  ): Promise<Recipe> {
    return this.recipesService.create(request.user.id, body);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  update(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateRecipeDto,
  ): Promise<Recipe> {
    return this.recipesService.update(request.user.id, id, body);
  }

  @Post(':id/submit')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  submit(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<Recipe> {
    return this.recipesService.submit(request.user.id, id);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  delete(
    @Param('id') id: string,
    @Query('confirm') confirm: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ favoritesCount: number } | void> {
    return this.recipesService.delete(request.user.id, id, confirm === 'true');
  }
}
