import { ReportReason, ReportTargetType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateReportDto {
  @IsEnum(ReportTargetType)
  target_type!: ReportTargetType;

  @IsUUID()
  target_id!: string;

  @IsEnum(ReportReason)
  reason!: ReportReason;

  @IsOptional()
  @IsString()
  free_text?: string;
}
