import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { useSessionStore } from '@/module/auth/store/use-session-store';
import {
  commentsService as defaultCommentsService,
  CommentsServiceError,
  type CommentRatingDto,
  type CommentsService,
} from '@/module/recipes/services/comments-service';
import {
  reportsService as defaultReportsService,
  ReportsServiceError,
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

const RATE_LIMIT_MESSAGE = 'Limite diário atingido. Tente novamente amanhã.';
const DUPLICATE_REPORT_MESSAGE = 'Você já denunciou este comentário.';
const GENERIC_WRITE_ERROR = 'Não foi possível salvar. Tente novamente.';
const GENERIC_REPORT_ERROR = 'Não foi possível enviar a denúncia. Tente novamente.';

function mapWriteError(error: unknown): string {
  if (error instanceof CommentsServiceError && error.status === 429) {
    return RATE_LIMIT_MESSAGE;
  }
  return GENERIC_WRITE_ERROR;
}

function mapReportError(error: unknown): string {
  if (error instanceof ReportsServiceError) {
    if (error.status === 409) return DUPLICATE_REPORT_MESSAGE;
    if (error.status === 429) return RATE_LIMIT_MESSAGE;
  }
  return GENERIC_REPORT_ERROR;
}

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

  const ownReview = useMemo(() => {
    if (!currentUserId) return null;
    const own = items.find((item) => item.userId === currentUserId);
    return own ? { rating: own.rating, commentText: own.commentText ?? '' } : null;
  }, [items, currentUserId]);

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
        setError(mapWriteError(submitError));
        throw submitError;
      }
    },
    [commentsService, recipeId, invalidate],
  );

  const deleteOwn = useCallback(async () => {
    const own = items.find((item) => item.userId === currentUserId);
    if (!own) return;
    try {
      await commentsService.remove(own.id);
      await invalidate();
      setError(null);
    } catch (deleteError) {
      setError(mapWriteError(deleteError));
      throw deleteError;
    }
  }, [commentsService, currentUserId, items, invalidate]);

  const report = useCallback(
    async (commentId: string, reason: ReportReason, freeText?: string) => {
      try {
        await reportsService.create({ targetType: 'comment', targetId: commentId, reason, freeText });
        setError(null);
      } catch (reportError) {
        setError(mapReportError(reportError));
        throw reportError;
      }
    },
    [reportsService],
  );

  return {
    items,
    isLoading: query.isLoading,
    loadMore,
    hasMore: query.hasNextPage ?? false,
    ownReview,
    submit,
    deleteOwn,
    report,
    error,
  };
}
