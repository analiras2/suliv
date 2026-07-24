import { CommentRating } from '@prisma/client';

export class CommentRatingDto {
  id!: string;
  userId!: string;
  userName!: string;
  rating!: number;
  commentText!: string | null;
  createdAt!: string;
  updatedAt!: string;

  static fromRow(row: CommentRating, userName: string): CommentRatingDto {
    return {
      id: row.id,
      userId: row.userId,
      userName,
      rating: row.rating,
      commentText: row.commentText,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
