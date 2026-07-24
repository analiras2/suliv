import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { RatingStarsPicker } from '@/components/molecules/rating-stars-picker';
import { fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';

export type CommentComposerProps = {
  ownReview: { rating: number; commentText: string } | null;
  onSubmit: (rating: number, commentText?: string) => void;
  onDelete: () => void;
};

// Parent re-keys this component (see comments-section.tsx) whenever `ownReview` transitions
// between null/populated or changes value, so local form state can be seeded once from props
// instead of synced via an effect.
export function CommentComposer({ ownReview, onSubmit, onDelete }: CommentComposerProps) {
  const [rating, setRating] = useState(ownReview?.rating ?? 0);
  const [commentText, setCommentText] = useState(ownReview?.commentText ?? '');

  const isEditMode = ownReview !== null;

  return (
    <View style={styles.container} testID="comment-composer">
      <Text style={styles.label}>{isEditMode ? 'Sua avaliação' : 'Avaliar receita'}</Text>
      <RatingStarsPicker key={ownReview?.rating ?? 'new'} onRate={setRating} initialValue={ownReview?.rating} />
      <TextInput
        value={commentText}
        onChangeText={setCommentText}
        placeholder="O que você achou dessa receita? (opcional)"
        placeholderTextColor={semanticColors.fgTertiary}
        multiline
        style={styles.textInput}
        testID="comment-composer-text"
      />
      <View style={styles.actions}>
        {isEditMode ? (
          <Button tone="ghost" size="sm" onPress={onDelete} testID="comment-composer-delete">
            Excluir
          </Button>
        ) : null}
        <Button
          tone="primary"
          size="sm"
          onPress={() => onSubmit(rating, commentText || undefined)}
          testID="comment-composer-submit">
          {isEditMode ? 'Salvar alterações' : 'Publicar'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: semanticColors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: semanticColors.border,
    padding: spacing.sm + 2,
    gap: spacing.sm,
  },
  label: {
    ...typography.labelMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fg,
  },
  textInput: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fg,
    borderWidth: 1,
    borderColor: semanticColors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
