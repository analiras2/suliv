import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Overline } from '@/components/atoms/overline';
import { CommentComposer } from '@/components/molecules/comment-composer';
import { CommentListItem } from '@/components/molecules/comment-list-item';
import { ReportReasonPicker } from '@/components/molecules/report-reason-picker';
import { fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';
import { useSessionStore } from '@/module/auth/store/use-session-store';
import { useCommentsViewModel } from '@/module/recipes/viewModels/use-comments-view-model';

export type CommentsSectionProps = {
  recipeId: string;
  onReviewChanged?: () => void;
};

const REPORT_SUCCESS_MESSAGE = 'Denúncia enviada. Obrigado por ajudar a manter a comunidade segura.';

export function CommentsSection({ recipeId, onReviewChanged }: CommentsSectionProps) {
  const { items, isLoading, loadMore, hasMore, ownReview, submit, deleteOwn, report, error } =
    useCommentsViewModel(recipeId);
  const currentUserId = useSessionStore((state) => state.session?.user.id);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);

  const handleSubmit = (rating: number, commentText?: string) => {
    submit(rating, commentText)
      .then(() => onReviewChanged?.())
      .catch(() => undefined);
  };

  const handleDelete = () => {
    Alert.alert('Excluir avaliação?', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () =>
          deleteOwn()
            .then(() => onReviewChanged?.())
            .catch(() => undefined),
      },
    ]);
  };

  const handleReportSubmit = (reason: Parameters<typeof report>[1]) => {
    if (!reportingCommentId) return;
    const commentId = reportingCommentId;
    setReportingCommentId(null);
    report(commentId, reason)
      .then(() => setReportFeedback(REPORT_SUCCESS_MESSAGE))
      .catch(() => undefined);
  };

  return (
    <View style={styles.container}>
      <Overline>avaliações</Overline>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {reportFeedback ? (
        <Text style={styles.success} testID="report-success-message">
          {reportFeedback}
        </Text>
      ) : null}

      <CommentComposer
        key={ownReview ? `edit-${ownReview.rating}-${ownReview.commentText}` : 'create'}
        ownReview={ownReview}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />

      {reportingCommentId ? (
        <ReportReasonPicker onSubmit={handleReportSubmit} onCancel={() => setReportingCommentId(null)} />
      ) : null}

      <View style={styles.list} testID="comments-list">
        {items.length === 0 && !isLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhuma avaliação ainda</Text>
          </View>
        ) : (
          items.map((comment) => (
            <CommentListItem
              key={comment.id}
              comment={comment}
              isOwn={comment.userId === currentUserId}
              onReport={() => {
                setReportFeedback(null);
                setReportingCommentId(comment.id);
              }}
            />
          ))
        )}
      </View>

      {hasMore ? (
        <Pressable onPress={loadMore} testID="comments-load-more" style={styles.loadMore}>
          <Text style={styles.loadMoreLabel}>Ver mais avaliações</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  error: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.danger,
  },
  success: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgBrand,
  },
  list: {
    gap: spacing.xs,
  },
  emptyCard: {
    backgroundColor: semanticColors.bgSubtle,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md - 2,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgSecondary,
  },
  loadMore: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  loadMoreLabel: {
    ...typography.labelMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fgBrand,
  },
});
