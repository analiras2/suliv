import {
  Controller,
  Delete,
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
import { AdminAllergensService } from './admin-allergens.service';
import { AdminAllergenDto, ListAdminAllergensQueryDto } from './dto';

type AuthenticatedAdminRequest = Request & { user: AuthenticatedAdmin };

@Controller('admin/allergens')
@UseGuards(AdminAuthGuard)
export class AdminAllergensController {
  constructor(private readonly adminAllergensService: AdminAllergensService) {}

  @Get()
  async list(
    @Query() query: ListAdminAllergensQueryDto,
  ): Promise<AdminAllergenDto[]> {
    void query.status;
    const allergens = await this.adminAllergensService.listPending();
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
}
