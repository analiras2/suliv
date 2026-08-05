import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../../admin-auth/admin-auth.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { AuditLogModule } from '../audit-log.module';
import { AdminRecipesController } from './admin-recipes.controller';
import { AdminRecipesService } from './admin-recipes.service';

@Module({
  imports: [AdminAuthModule, NotificationsModule, AuditLogModule],
  controllers: [AdminRecipesController],
  providers: [AdminRecipesService],
})
export class AdminRecipesModule {}
