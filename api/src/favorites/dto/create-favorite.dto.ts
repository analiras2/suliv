import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateFavoriteDto {
  @IsUUID()
  recipe_id!: string;

  @IsOptional()
  @IsString()
  idempotency_key?: string;
}
