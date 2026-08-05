import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../../admin-auth/admin-auth.module';
import { AuditLogModule } from '../audit-log.module';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';

@Module({
  imports: [AdminAuthModule, AuditLogModule],
  controllers: [AdminReportsController],
  providers: [AdminReportsService],
})
export class AdminReportsModule {}
