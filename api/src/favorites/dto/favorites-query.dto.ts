import { IsOptional, IsString } from 'class-validator';

export class FavoritesQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;
}
