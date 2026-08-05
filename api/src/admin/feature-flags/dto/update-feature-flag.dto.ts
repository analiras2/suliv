import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateFeatureFlagDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  rollout_percentage?: number;
}
