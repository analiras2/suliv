import { AdjustmentReason } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class RequestAdjustmentDto {
  @IsEnum(AdjustmentReason)
  reason!: AdjustmentReason;

  @IsOptional()
  @IsString()
  note?: string;
}
