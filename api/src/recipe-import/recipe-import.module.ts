import { Module } from '@nestjs/common';
import { RecipeImportService } from './recipe-import.service';
import { RecipeTranslationService } from './recipe-translation.service';
import { SpoonacularClient } from './spoonacular.client';

@Module({
  providers: [RecipeImportService, SpoonacularClient, RecipeTranslationService],
  exports: [RecipeImportService],
})
export class RecipeImportModule {}
