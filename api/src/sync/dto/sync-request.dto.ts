import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SyncActionDto {
  @IsNotEmpty()
  @IsString()
  type!: string;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsNotEmpty()
  @IsString()
  idempotency_key!: string;
}

export class SyncRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SyncActionDto)
  actions!: SyncActionDto[];
}
