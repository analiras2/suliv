import { CookingLevel, DietPreference } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { DraftIngredientDto } from './draft-ingredient.dto';
import { DraftStepDto } from './draft-step.dto';

export class CreateRecipeDto {
  @IsUUID('4')
  id!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsUUID('4')
  categoryId!: string;

  @IsInt()
  @Min(1)
  prepTimeMinutes!: number;

  @IsInt()
  @Min(1)
  servings!: number;

  @IsEnum(CookingLevel)
  difficulty!: CookingLevel;

  @IsEnum(DietPreference)
  dietPreference!: DietPreference;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DraftIngredientDto)
  ingredients!: DraftIngredientDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DraftStepDto)
  steps!: DraftStepDto[];

  @IsOptional()
  @IsString()
  authorMessageToModerator?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;
}
