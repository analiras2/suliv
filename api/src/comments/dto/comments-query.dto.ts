import { IsOptional, IsString } from 'class-validator';

export class CommentsQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;
}
