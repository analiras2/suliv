import { Type } from 'class-transformer';
import { IsDate, IsInt, IsString, Min } from 'class-validator';

export class CreateBoostDto {
  @IsString()
  recipe_id!: string;

  @IsInt()
  @Min(1)
  weight!: number;

  @Type(() => Date)
  @IsDate()
  starts_at!: Date;

  @Type(() => Date)
  @IsDate()
  ends_at!: Date;
}
