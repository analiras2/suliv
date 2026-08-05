import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../../admin-auth/admin-auth.module';
import { AuditLogModule } from '../audit-log.module';
import { AdminAllergensController } from './admin-allergens.controller';
import { AdminAllergensService } from './admin-allergens.service';

@Module({
  imports: [AdminAuthModule, AuditLogModule],
  controllers: [AdminAllergensController],
  providers: [AdminAllergensService],
})
export class AdminAllergensModule {}
