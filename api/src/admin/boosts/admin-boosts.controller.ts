import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminAuthGuard } from '../../admin-auth/admin-auth.guard';
import { AuthenticatedAdmin } from '../../admin-auth/admin-jwt.strategy';
import { AdminBoostsService } from './admin-boosts.service';
import { AdminBoostDto, CreateBoostDto } from './dto';

type AuthenticatedAdminRequest = Request & { user: AuthenticatedAdmin };

@Controller('admin/boosts')
@UseGuards(AdminAuthGuard)
export class AdminBoostsController {
  constructor(private readonly adminBoostsService: AdminBoostsService) {}

  @Get()
  async list(): Promise<AdminBoostDto[]> {
    const boosts = await this.adminBoostsService.list();
    const now = new Date();
    return boosts.map((boost) => AdminBoostDto.fromBoost(boost, now));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: CreateBoostDto,
    @Req() request: AuthenticatedAdminRequest,
  ): Promise<AdminBoostDto> {
    const boost = await this.adminBoostsService.create(
      request.user.id,
      body.recipe_id,
      body.weight,
      body.starts_at,
      body.ends_at,
    );
    return AdminBoostDto.fromBoost(boost, new Date());
  }
}
