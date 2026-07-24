import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { AuthenticatedUser } from '../auth/supabase-jwt.strategy';
import { CommentRatingDto } from './comment-rating.dto';
import { PaginatedComments, CommentsService } from './comments.service';
import { CommentsQueryDto, SubmitCommentDto } from './dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('recipes/:id/comments')
  @UseGuards(OptionalAuthGuard)
  list(
    @Param('id') recipeId: string,
    @Query() query: CommentsQueryDto,
  ): Promise<PaginatedComments> {
    return this.commentsService.list(recipeId, query.cursor);
  }

  @Post('recipes/:id/comments')
  @UseGuards(SupabaseAuthGuard)
  submit(
    @Param('id') recipeId: string,
    @Body() body: SubmitCommentDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<CommentRatingDto> {
    return this.commentsService.upsert(recipeId, request.user.id, {
      rating: body.rating,
      commentText: body.comment_text,
    });
  }

  @Delete('comments/:id')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') commentId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.commentsService.remove(commentId, request.user.id);
  }
}
