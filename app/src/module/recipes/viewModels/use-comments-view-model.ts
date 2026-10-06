import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { getErrorMessage } from '@/lib/error-messages';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import {
  commentsService as defaultCommentsService,
  type CommentRatingDto,
  type CommentsService,
} from '@/module/recipes/services/comments-service';
import {
  reportsService as defaultReportsService,
  type ReportReason,
  type ReportsService,
} from '@/module/recipes/services/reports-service';

export interface CommentsViewModel {
  items: CommentRatingDto[];
  isLoading: boolean;
  loadMore: () => void;
  hasMore: boolean;
  ownReview: { rating: number; commentText: string } | null;
  submit: (rating: number, commentText?: string) => Promise<void>;
  deleteOwn: () => Promise<void>;
  report: (commentId: string, reason: ReportReason, freeText?: string) => Promise<void>;
  error: string | null;
}

export interface CommentsViewModelDeps {
  commentsService: CommentsService;
  reportsService: ReportsService;
}

const defaultDeps: CommentsViewModelDeps = {
  commentsService: defaultCommentsService,
  reportsService: defaultReportsService,
};

const GENERIC_WRITE_ERROR = 'Não foi possível salvar. Tente novamente.';
const GENERIC_REPORT_ERROR = 'Não foi possível enviar a denúncia. Tente novamente.';


export function useCommentsViewModel(
  recipeId: string,
  deps: Partial<CommentsViewModelDeps> = {},
): CommentsViewModel {
  const { commentsService, reportsService } = { ...defaultDeps, ...deps };
  const currentUserId = useSessionStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const query = useInfiniteQuery({
    queryKey: ['comments', recipeId],
    queryFn: ({ pageParam }: { pageParam?: string }) => commentsService.list(recipeId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    retry: false,
  });

  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  const ownReviewQuery = useQuery({
    queryKey: ['comments', recipeId, 'own', currentUserId],
    queryFn: () => commentsService.getOwn(recipeId),
    enabled: !!currentUserId,
  });

  const ownReviewDto = ownReviewQuery.data ?? null;

  const ownReview = useMemo(() => {
    if (!ownReviewDto) return null;
    return { rating: ownReviewDto.rating, commentText: ownReviewDto.commentText ?? '' };
  }, [ownReviewDto]);

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['comments', recipeId] }),
    [queryClient, recipeId],
  );

  const submit = useCallback(
    async (rating: number, commentText?: string) => {
      try {
        await commentsService.upsert(recipeId, { rating, commentText });
        await invalidate();
        setError(null);
      } catch (submitError) {
        setError(getErrorMessage(submitError, GENERIC_WRITE_ERROR));
        throw submitError;
      }
    },
    [commentsService, recipeId, invalidate],
  );

  const deleteOwn = useCallback(async () => {
    if (!ownReviewDto) return;
    try {
      await commentsService.remove(ownReviewDto.id);
      await invalidate();
      setError(null);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, GENERIC_WRITE_ERROR));
      throw deleteError;
    }
  }, [commentsService, ownReviewDto, invalidate]);

  const report = useCallback(
    async (commentId: string, reason: ReportReason, freeText?: string) => {
      try {
        await reportsService.create({ targetType: 'comment', targetId: commentId, reason, freeText });
        setError(null);
      } catch (reportError) {
        setError(getErrorMessage(reportError, GENERIC_REPORT_ERROR));
        throw reportError;
      }
    },
    [reportsService],
  );

  return {
    items,
    isLoading: query.isLoading || ownReviewQuery.isLoading,
    loadMore,
    hasMore: query.hasNextPage ?? false,
    ownReview,
    submit,
    deleteOwn,
    report,
    error,
  };
}
