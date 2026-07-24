import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class DraftStepDto {
  @IsInt()
  @Min(0)
  order!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stepTimeSeconds!: number | null;
}
