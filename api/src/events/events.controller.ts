import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/supabase-jwt.strategy';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { IngestEventsDto } from './dto/ingest-events.dto';
import { EventsService } from './events.service';

type OptionallyAuthenticatedRequest = Request & { user?: AuthenticatedUser };

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(200)
  @UseGuards(OptionalAuthGuard)
  async ingest(
    @Body() body: IngestEventsDto,
    @Req() request: OptionallyAuthenticatedRequest,
  ): Promise<{ ok: true }> {
    await this.eventsService.ingest(body, request.user?.id);
    return { ok: true };
  }
}
