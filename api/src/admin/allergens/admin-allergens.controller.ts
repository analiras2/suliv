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
import { Request } from 'express';
import { AdminAuthGuard } from '../../admin-auth/admin-auth.guard';
import { AuthenticatedAdmin } from '../../admin-auth/admin-jwt.strategy';
import { AdminAllergensService } from './admin-allergens.service';
import {
  AdminAllergenDto,
  AdminAllergenIngredientTermDto,
  ListAdminAllergensQueryDto,
  UpsertAllergenIngredientTermDto,
} from './dto';

type AuthenticatedAdminRequest = Request & { user: AuthenticatedAdmin };

@Controller('admin/allergens')
@UseGuards(AdminAuthGuard)
export class AdminAllergensController {
  constructor(private readonly adminAllergensService: AdminAllergensService) {}

  @Get()
  async list(
    @Query() query: ListAdminAllergensQueryDto,
  ): Promise<AdminAllergenDto[]> {
    const allergens =
      query.status === 'approved'
        ? await this.adminAllergensService.listApproved()
        : await this.adminAllergensService.listPending();
    return allergens.map((allergen) => AdminAllergenDto.fromAllergen(allergen));
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id') id: string,
    @Req() request: AuthenticatedAdminRequest,
  ): Promise<void> {
    return this.adminAllergensService.approve(request.user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @Req() request: AuthenticatedAdminRequest,
  ): Promise<void> {
    return this.adminAllergensService.reject(request.user.id, id);
  }

  @Post(':allergenId/ingredient-terms')
  @HttpCode(HttpStatus.CREATED)
  createTerm(
    @Param('allergenId') allergenId: string,
    @Body() body: UpsertAllergenIngredientTermDto,
    @Req() request: AuthenticatedAdminRequest,
  ): Promise<AdminAllergenIngredientTermDto> {
    return this.adminAllergensService.createTerm(
      request.user.id,
      allergenId,
      body.term,
    );
  }

  @Patch(':allergenId/ingredient-terms/:termId')
  updateTerm(
    @Param('allergenId') allergenId: string,
    @Param('termId') termId: string,
    @Body() body: UpsertAllergenIngredientTermDto,
    @Req() request: AuthenticatedAdminRequest,
  ): Promise<AdminAllergenIngredientTermDto> {
    return this.adminAllergensService.updateTerm(
      request.user.id,
      allergenId,
      termId,
      body.term,
    );
  }

  @Delete(':allergenId/ingredient-terms/:termId')
  @HttpCode(HttpStatus.OK)
  deleteTerm(
    @Param('allergenId') allergenId: string,
    @Param('termId') termId: string,
    @Req() request: AuthenticatedAdminRequest,
  ): Promise<void> {
    return this.adminAllergensService.deleteTerm(
      request.user.id,
      allergenId,
      termId,
    );
  }
}
