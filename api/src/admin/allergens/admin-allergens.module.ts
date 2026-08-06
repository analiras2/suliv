import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../../admin-auth/admin-auth.module';
import { AllergenClassificationModule } from '../../allergen-classification/allergen-classification.module';
import { AuditLogModule } from '../audit-log.module';
import { AdminAllergensController } from './admin-allergens.controller';
import { AdminAllergensService } from './admin-allergens.service';

@Module({
  imports: [AdminAuthModule, AuditLogModule, AllergenClassificationModule],
  controllers: [AdminAllergensController],
  providers: [AdminAllergensService],
})
export class AdminAllergensModule {}
