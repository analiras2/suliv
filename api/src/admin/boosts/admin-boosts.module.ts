import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../../admin-auth/admin-auth.module';
import { AuditLogModule } from '../audit-log.module';
import { AdminBoostsController } from './admin-boosts.controller';
import { AdminBoostsService } from './admin-boosts.service';

@Module({
  imports: [AdminAuthModule, AuditLogModule],
  controllers: [AdminBoostsController],
  providers: [AdminBoostsService],
})
export class AdminBoostsModule {}
