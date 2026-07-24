import type { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactNode } from 'react';

// The real default deps transitively import auth-service, which eagerly constructs a Supabase
// client requiring env vars not set in this test environment. Every test here injects its own
// deps, so the defaults only need to exist as importable stubs.
jest.mock('@/module/recipes/services/comments-service', () => ({
  commentsService: { list: jest.fn(), upsert: jest.fn(), remove: jest.fn() },
  CommentsServiceError: class CommentsServiceError extends Error {
    status: number;
    constructor(status: number) {
      super(`Comments request failed with status ${status}.`);
      this.status = status;
    }
  },
}));
jest.mock('@/module/recipes/services/reports-service', () => ({
  reportsService: { create: jest.fn() },
  ReportsServiceError: class ReportsServiceError extends Error {
    status: number;
    constructor(status: number) {
      super(`Report request failed with status ${status}.`);
      this.status = status;
    }
  },
}));

// eslint-disable-next-line import/first
import { useSessionStore } from '@/module/auth/store/use-session-store';
// eslint-disable-next-line import/first
import type { CommentRatingDto, CommentsService } from '@/module/recipes/services/comments-service';
// eslint-disable-next-line import/first
import type { ReportsService } from '@/module/recipes/services/reports-service';

// eslint-disable-next-line import/first
import { useCommentsViewModel } from './use-comments-view-model';

const otherUserComment: CommentRatingDto = {
  id: 'comment-1',
  userId: 'user-other',
  userName: 'Ana',
  rating: 5,
  commentText: 'Muito bom',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

const ownComment: CommentRatingDto = {
  id: 'comment-2',
  userId: 'user-1',
  userName: 'Você',
  rating: 3,
  commentText: 'bom',
  createdAt: '2026-07-02T00:00:00.000Z',
  updatedAt: '2026-07-02T00:00:00.000Z',
};

function buildCommentsService(items: CommentRatingDto[]): jest.Mocked<CommentsService> {
  return {
    list: jest.fn(async () => ({ items, nextCursor: null })),
    upsert: jest.fn(),
    remove: jest.fn(),
  };
}

function buildReportsService(): jest.Mocked<ReportsService> {
  return { create: jest.fn() };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useCommentsViewModel', () => {
  beforeEach(() => {
    useSessionStore.setState({
      session: { user: { id: 'user-1' } } as unknown as Session,
      user: null,
      status: 'authenticated',
    });
  });

  // UT-014
  it('ownReview is null when the current user has no existing review for the recipe', async () => {
    const commentsService = buildCommentsService([otherUserComment]);
    const reportsService = buildReportsService();

    const { result } = await renderHook(
      () => useCommentsViewModel('recipe-1', { commentsService, reportsService }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.ownReview).toBeNull();
    expect(result.current.items).toEqual([otherUserComment]);
  });

  // UT-015
  it('ownReview reflects the existing rating/commentText when the current user has already reviewed', async () => {
    const commentsService = buildCommentsService([otherUserComment, ownComment]);
    const reportsService = buildReportsService();

    const { result } = await renderHook(
      () => useCommentsViewModel('recipe-1', { commentsService, reportsService }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.ownReview).toEqual({ rating: 3, commentText: 'bom' });
  });
});
