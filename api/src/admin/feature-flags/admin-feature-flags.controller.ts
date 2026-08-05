import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminAuthGuard } from '../../admin-auth/admin-auth.guard';
import { AuthenticatedAdmin } from '../../admin-auth/admin-jwt.strategy';
import { AdminFeatureFlagsService } from './admin-feature-flags.service';
import { FeatureFlagDto, UpdateFeatureFlagDto } from './dto';

type AuthenticatedAdminRequest = Request & { user: AuthenticatedAdmin };

@Controller('admin/feature-flags')
@UseGuards(AdminAuthGuard)
export class AdminFeatureFlagsController {
  constructor(
    private readonly adminFeatureFlagsService: AdminFeatureFlagsService,
  ) {}

  @Get()
  async list(): Promise<FeatureFlagDto[]> {
    const flags = await this.adminFeatureFlagsService.listAll();
    return flags.map((flag) => FeatureFlagDto.fromFeatureFlag(flag));
  }

  @Patch(':key')
  async update(
    @Param('key') key: string,
    @Body() body: UpdateFeatureFlagDto,
    @Req() request: AuthenticatedAdminRequest,
  ): Promise<FeatureFlagDto> {
    const flag = await this.adminFeatureFlagsService.update(
      request.user.id,
      key,
      {
        enabled: body.enabled,
        rolloutPercentage: body.rollout_percentage,
      },
    );
    return FeatureFlagDto.fromFeatureFlag(flag);
  }
}
