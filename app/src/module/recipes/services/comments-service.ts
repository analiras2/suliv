import { apiRequest, apiRequestJson } from '@/lib/api-client';

export interface CommentRatingDto {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  commentText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedComments {
  items: CommentRatingDto[];
  nextCursor: string | null;
}

export interface CommentsService {
  list(recipeId: string, cursor?: string): Promise<PaginatedComments>;
  getOwn(recipeId: string): Promise<CommentRatingDto | null>;
  upsert(recipeId: string, input: { rating: number; commentText?: string }): Promise<CommentRatingDto>;
  remove(commentId: string): Promise<void>;
}

export const commentsService: CommentsService = {
  list(recipeId, cursor) {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return apiRequestJson<PaginatedComments>(`/recipes/${recipeId}/comments${query}`, { auth: 'optional' });
  },

  getOwn: (recipeId) => apiRequestJson<CommentRatingDto | null>(`/recipes/${recipeId}/comments/me`),

  upsert: (recipeId, input) =>
    apiRequestJson<CommentRatingDto>(`/recipes/${recipeId}/comments`, {
      method: 'POST',
      body: { rating: input.rating, comment_text: input.commentText },
    }),

  async remove(commentId) {
    await apiRequest(`/comments/${commentId}`, { method: 'DELETE' });
  },
};
