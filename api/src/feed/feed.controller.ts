import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Category } from '@prisma/client';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/supabase-jwt.strategy';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { FeedResponseDto, FeedService } from './feed.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller()
@UseGuards(SupabaseAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('feed')
  getFeed(@Req() request: AuthenticatedRequest): Promise<FeedResponseDto> {
    return this.feedService.getFeed(request.user.id);
  }

  @Get('categories')
  getCategories(): Promise<Category[]> {
    return this.feedService.getCategories();
  }
}
