import type { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactNode } from 'react';

// The real default deps transitively import auth-service, which eagerly constructs a Supabase
// client requiring env vars not set in this test environment. Every test here injects its own
// deps, so the defaults only need to exist as importable stubs.
jest.mock('@/module/recipes/services/comments-service', () => ({
  commentsService: { list: jest.fn(), getOwn: jest.fn(), upsert: jest.fn(), remove: jest.fn() },
}));
jest.mock('@/module/recipes/services/reports-service', () => ({
  reportsService: { create: jest.fn() },
}));

// eslint-disable-next-line import/first
import { ApiError } from '@/lib/api-error';
// eslint-disable-next-line import/first
import { ERROR_MESSAGES } from '@/lib/error-messages';
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

function buildCommentsService(
  items: CommentRatingDto[],
  ownReview: CommentRatingDto | null = null,
): jest.Mocked<CommentsService> {
  return {
    list: jest.fn(async () => ({ items, nextCursor: null })),
    getOwn: jest.fn(async () => ownReview),
    upsert: jest.fn(),
    remove: jest.fn(),
  };
}

function buildReportsService(): jest.Mocked<ReportsService> {
  return { create: jest.fn() };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
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
    const commentsService = buildCommentsService([otherUserComment, ownComment], ownComment);
    const reportsService = buildReportsService();

    const { result } = await renderHook(
      () => useCommentsViewModel('recipe-1', { commentsService, reportsService }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.ownReview).toEqual({ rating: 3, commentText: 'bom' });
  });

  it('ownReview is resolved via a dedicated lookup even when the current user review is outside the loaded page', async () => {
    const commentsService = buildCommentsService([otherUserComment], ownComment);
    const reportsService = buildReportsService();

    const { result } = await renderHook(
      () => useCommentsViewModel('recipe-1', { commentsService, reportsService }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(commentsService.getOwn).toHaveBeenCalledWith('recipe-1');
    expect(result.current.items).toEqual([otherUserComment]);
    expect(result.current.ownReview).toEqual({ rating: 3, commentText: 'bom' });
  });

  it('deleteOwn removes the review resolved from the dedicated lookup even when it is outside the loaded page', async () => {
    const commentsService = buildCommentsService([otherUserComment], ownComment);
    const reportsService = buildReportsService();

    const { result } = await renderHook(
      () => useCommentsViewModel('recipe-1', { commentsService, reportsService }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deleteOwn();
    });

    expect(commentsService.remove).toHaveBeenCalledWith(ownComment.id);
  });

  it('UT-056 shows the duplicate-report copy when the report is rejected with REPORT_DUPLICATE', async () => {
    const commentsService = buildCommentsService([otherUserComment]);
    const reportsService = buildReportsService();
    reportsService.create.mockRejectedValue(new ApiError('REPORT_DUPLICATE', 409));
    const { result } = await renderHook(
      () => useCommentsViewModel('recipe-1', { commentsService, reportsService }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.report('comment-1', 'spam').catch(() => undefined));

    expect(result.current.error).toBe(ERROR_MESSAGES.REPORT_DUPLICATE);
  });

  it('UT-057 shows the rate-limit copy when a write is rejected with COMMENT_RATE_LIMITED', async () => {
    const commentsService = buildCommentsService([otherUserComment]);
    commentsService.upsert.mockRejectedValue(new ApiError('COMMENT_RATE_LIMITED', 429));
    const { result } = await renderHook(
      () => useCommentsViewModel('recipe-1', { commentsService, reportsService: buildReportsService() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.submit(4, 'bom').catch(() => undefined));

    expect(result.current.error).toBe(ERROR_MESSAGES.COMMENT_RATE_LIMITED);
  });

  it('falls back to the action wording for an unrecognised failure', async () => {
    const commentsService = buildCommentsService([otherUserComment]);
    commentsService.upsert.mockRejectedValue(new Error('boom'));
    const { result } = await renderHook(
      () => useCommentsViewModel('recipe-1', { commentsService, reportsService: buildReportsService() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.submit(4, 'bom').catch(() => undefined));

    expect(result.current.error).toBe('Não foi possível salvar. Tente novamente.');
  });
});
