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
  AdminReportsService,
  PaginatedAdminReports,
} from './admin-reports.service';
import { ListAdminReportsQueryDto, ResolveReportDto } from './dto';

type AuthenticatedAdminRequest = Request & { user: AuthenticatedAdmin };

@Controller('admin/reports')
@UseGuards(AdminAuthGuard)
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @Get()
  list(
    @Query() query: ListAdminReportsQueryDto,
  ): Promise<PaginatedAdminReports> {
    return this.adminReportsService.listPending(query.status, query.cursor);
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  resolve(
    @Param('id') id: string,
    @Body() body: ResolveReportDto,
    @Req() request: AuthenticatedAdminRequest,
  ): Promise<void> {
    return this.adminReportsService.resolve(request.user.id, id, body.action);
  }
}
