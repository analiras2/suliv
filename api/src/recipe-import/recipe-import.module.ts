import { Module } from '@nestjs/common';
import { AllergenClassificationModule } from '../allergen-classification/allergen-classification.module';
import { RecipeImportService } from './recipe-import.service';
import { RecipeTranslationService } from './recipe-translation.service';
import { SpoonacularClient } from './spoonacular.client';

@Module({
  imports: [AllergenClassificationModule],
  providers: [RecipeImportService, SpoonacularClient, RecipeTranslationService],
  exports: [RecipeImportService],
})
export class RecipeImportModule {}
