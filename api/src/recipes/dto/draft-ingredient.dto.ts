import { IngredientUnit } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class DraftIngredientDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsNumber()
  quantity!: number | null;

  @IsEnum(IngredientUnit)
  unit!: IngredientUnit;

  @IsBoolean()
  scalesWithServings!: boolean;

  @IsInt()
  @Min(0)
  order!: number;
}
