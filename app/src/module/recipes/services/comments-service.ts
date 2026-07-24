import { authService, type AuthService } from '@/module/auth/services/auth-service';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

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
  upsert(recipeId: string, input: { rating: number; commentText?: string }): Promise<CommentRatingDto>;
  remove(commentId: string): Promise<void>;
}

export class CommentsServiceError extends Error {
  constructor(readonly status: number) {
    super(`Comments request failed with status ${status}.`);
  }
}

async function buildHeaders(authentication: AuthService, withContentType: boolean): Promise<Record<string, string>> {
  const session = await authentication.getSession();
  const headers: Record<string, string> = {};
  if (withContentType) {
    headers['Content-Type'] = 'application/json';
  }
  if (session) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

export function createCommentsService(authentication: AuthService = authService): CommentsService {
  return {
    async list(recipeId, cursor) {
      const headers = await buildHeaders(authentication, false);
      const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/comments${query}`, { headers });

      if (!response.ok) {
        throw new CommentsServiceError(response.status);
      }

      return response.json() as Promise<PaginatedComments>;
    },

    async upsert(recipeId, input) {
      const headers = await buildHeaders(authentication, true);
      const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rating: input.rating, comment_text: input.commentText }),
      });

      if (!response.ok) {
        throw new CommentsServiceError(response.status);
      }

      return response.json() as Promise<CommentRatingDto>;
    },

    async remove(commentId) {
      const headers = await buildHeaders(authentication, false);
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new CommentsServiceError(response.status);
      }
    },
  };
}

export const commentsService: CommentsService = createCommentsService();
