import { CookingFrequency, CookingLevel, DietPreference } from '@prisma/client';
import { IsArray, IsEnum, IsString, IsUUID } from 'class-validator';

export class OnboardingDto {
  @IsEnum(DietPreference)
  diet_preference!: DietPreference;

  @IsArray()
  @IsUUID('4', { each: true })
  allergen_ids!: string[];

  @IsArray()
  @IsString({ each: true })
  new_terms!: string[];

  @IsEnum(CookingLevel)
  cooking_level!: CookingLevel;

  @IsEnum(CookingFrequency)
  cooking_frequency!: CookingFrequency;
}
