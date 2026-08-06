import { Module } from '@nestjs/common';
import { AllergenBackfillService } from './allergen-backfill.service';
import { AllergenClassificationService } from './allergen-classification.service';

@Module({
  providers: [AllergenClassificationService, AllergenBackfillService],
  exports: [AllergenClassificationService, AllergenBackfillService],
})
export class AllergenClassificationModule {}
