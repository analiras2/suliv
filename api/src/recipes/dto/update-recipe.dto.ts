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

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  prepTimeMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  servings?: number;

  @IsOptional()
  @IsEnum(CookingLevel)
  difficulty?: CookingLevel;

  @IsOptional()
  @IsEnum(DietPreference)
  dietPreference?: DietPreference;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DraftIngredientDto)
  ingredients?: DraftIngredientDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DraftStepDto)
  steps?: DraftStepDto[];

  @IsOptional()
  @IsString()
  authorMessageToModerator?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;
}
