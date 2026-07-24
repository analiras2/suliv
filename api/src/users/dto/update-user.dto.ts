import { CookingFrequency, CookingLevel, DietPreference } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEnum(DietPreference)
  diet_preference?: DietPreference;

  @IsOptional()
  @IsEnum(CookingLevel)
  cooking_level?: CookingLevel;

  @IsOptional()
  @IsEnum(CookingFrequency)
  cooking_frequency?: CookingFrequency;
}
