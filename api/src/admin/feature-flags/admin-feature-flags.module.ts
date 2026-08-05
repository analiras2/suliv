import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../../admin-auth/admin-auth.module';
import { AuditLogModule } from '../audit-log.module';
import { AdminFeatureFlagsController } from './admin-feature-flags.controller';
import { AdminFeatureFlagsService } from './admin-feature-flags.service';

@Module({
  imports: [AdminAuthModule, AuditLogModule],
  controllers: [AdminFeatureFlagsController],
  providers: [AdminFeatureFlagsService],
})
export class AdminFeatureFlagsModule {}
