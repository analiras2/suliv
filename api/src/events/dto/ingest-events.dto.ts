import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DevicePlatform } from '@prisma/client';

export class AnalyticsEventDto {
  @IsNotEmpty()
  @IsString()
  sessionId!: string;

  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;

  @IsNotEmpty()
  @IsString()
  appVersion!: string;

  @IsNotEmpty()
  @IsString()
  eventName!: string;

  @IsObject()
  properties!: Record<string, unknown>;

  @IsISO8601()
  occurredAt!: string;
}

export class IngestEventsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AnalyticsEventDto)
  events!: AnalyticsEventDto[];

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
