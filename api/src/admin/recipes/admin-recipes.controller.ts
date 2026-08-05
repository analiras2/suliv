import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminAuthGuard } from '../../admin-auth/admin-auth.guard';
import { AuthenticatedAdmin } from '../../admin-auth/admin-jwt.strategy';
import {
  AdminRecipesService,
  PaginatedAdminRecipes,
} from './admin-recipes.service';
import {
  AdminRecipeDetailDto,
  ListAdminRecipesQueryDto,
  RequestAdjustmentDto,
} from './dto';

type AuthenticatedAdminRequest = Request & { user: AuthenticatedAdmin };

@Controller('admin/recipes')
@UseGuards(AdminAuthGuard)
export class AdminRecipesController {
  constructor(private readonly adminRecipesService: AdminRecipesService) {}

  @Get()
  list(
    @Query() query: ListAdminRecipesQueryDto,
  ): Promise<PaginatedAdminRecipes> {
    return this.adminRecipesService.listPending(query.status, query.cursor);
  }

  @Get(':id')
  getForReview(@Param('id') id: string): Promise<AdminRecipeDetailDto> {
    return this.adminRecipesService.getForReview(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id') id: string,
    @Req() request: AuthenticatedAdminRequest,
  ): Promise<void> {
    return this.adminRecipesService.approve(request.user.id, id);
  }

  @Post(':id/request-adjustment')
  @HttpCode(HttpStatus.OK)
  requestAdjustment(
    @Param('id') id: string,
    @Body() body: RequestAdjustmentDto,
    @Req() request: AuthenticatedAdminRequest,
  ): Promise<void> {
    return this.adminRecipesService.requestAdjustment(
      request.user.id,
      id,
      body.reason,
      body.note,
    );
  }
}
