import { IsInt, IsOptional, IsString } from 'class-validator';

export class SubmitCommentDto {
  // Range validation (1-5) happens in CommentsService, not here: an
  // out-of-range rating must surface as 422 (TechSpec Endpoints table),
  // while a class-validator DTO rejection would surface as 400.
  @IsInt()
  rating!: number;

  @IsOptional()
  @IsString()
  comment_text?: string;
}
