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
import { AuthenticatedUser } from '../auth/supabase-jwt.strategy';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { SyncRequestDto } from './dto/sync-request.dto';
import { SyncApplyResult, SyncService } from './sync.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  apply(
    @Body() body: SyncRequestDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<SyncApplyResult> {
    return this.syncService.apply(
      request.user.id,
      body.actions.map((action) => ({
        type: action.type,
        payload: action.payload,
        idempotencyKey: action.idempotency_key,
      })),
    );
  }
}
