import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { AuthenticatedUser } from '../auth/supabase-jwt.strategy';
import { FeatureFlagsService } from './feature-flags.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('feature-flags')
@UseGuards(SupabaseAuthGuard)
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  resolveAll(
    @Req() request: AuthenticatedRequest,
  ): Promise<Record<string, boolean>> {
    return this.featureFlagsService.resolveAll(request.user.id);
  }
}
