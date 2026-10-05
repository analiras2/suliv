import { Module } from '@nestjs/common';
import { AllergenBackfillService } from './allergen-backfill.service';
import { AllergenCatalogService } from './allergen-catalog.service';
import { AllergenClassificationService } from './allergen-classification.service';

@Module({
  providers: [
    AllergenClassificationService,
    AllergenBackfillService,
    AllergenCatalogService,
  ],
  exports: [
    AllergenClassificationService,
    AllergenBackfillService,
    AllergenCatalogService,
  ],
})
export class AllergenClassificationModule {}
