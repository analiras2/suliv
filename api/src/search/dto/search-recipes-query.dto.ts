import {
  CookingLevel,
  DietPreference,
  RecipeCategory,
  TimeBucket,
} from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import type { ListingOrigin } from '../search.service';

const LISTING_ORIGINS: ListingOrigin[] = [
  'selecionadas',
  'categoria',
  'top_semana',
  'busca',
];

export class SearchRecipesQueryDto {
  @IsOptional()
  @IsIn(LISTING_ORIGINS)
  origin?: ListingOrigin;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(RecipeCategory)
  category?: RecipeCategory;

  @IsOptional()
  @IsEnum(TimeBucket)
  time?: TimeBucket;

  @IsOptional()
  @IsEnum(CookingLevel)
  difficulty?: CookingLevel;

  @IsOptional()
  @IsEnum(DietPreference)
  diet?: DietPreference;

  @IsOptional()
  allergens?: string | string[];

  @IsOptional()
  @IsString()
  cursor?: string;
}
