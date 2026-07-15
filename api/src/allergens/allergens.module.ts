import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AllergensController } from './allergens.controller';
import { AllergensService } from './allergens.service';

@Module({
  imports: [AuthModule],
  controllers: [AllergensController],
  providers: [AllergensService],
})
export class AllergensModule {}
