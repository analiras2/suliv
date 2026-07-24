import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { AuthenticatedUser } from '../auth/supabase-jwt.strategy';
import { CreateReportDto } from './dto';
import { ReportsService } from './reports.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: CreateReportDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.reportsService.create(request.user.id, {
      targetType: body.target_type,
      targetId: body.target_id,
      reason: body.reason,
      freeText: body.free_text,
    });
  }
}
