import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import { colors, fontFamilies, radii, semanticColors, spacing, typography } from '@/design-system/tokens';
import type { CommentRatingDto } from '@/module/recipes/services/comments-service';

export type CommentListItemProps = {
  comment: CommentRatingDto;
  isOwn: boolean;
  onReport: () => void;
};

const STAR_VALUES = [1, 2, 3, 4, 5];

export function CommentListItem({ comment, isOwn, onReport }: CommentListItemProps) {
  return (
    <View style={styles.container} testID={`comment-item-${comment.id}`}>
      <View style={styles.header}>
        <Text style={styles.userName}>{comment.userName}</Text>
        <View style={styles.stars}>
          {STAR_VALUES.map((value) => (
            <Icon
              key={value}
              name="star"
              size={13}
              color={colors.clay500}
              strokeWidth={1.8}
              filled={value <= comment.rating}
            />
          ))}
        </View>
      </View>

      {comment.commentText ? <Text style={styles.text}>{comment.commentText}</Text> : null}

      {!isOwn ? (
        <Pressable
          onPress={onReport}
          hitSlop={6}
          testID={`comment-report-button-${comment.id}`}
          style={styles.reportButton}>
          <Text style={styles.reportLabel}>Denunciar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: semanticColors.bgSubtle,
    borderRadius: radii.md,
    padding: spacing.sm + 2,
    gap: spacing.xxs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    ...typography.labelMd,
    fontFamily: fontFamilies.sansSemibold,
    color: semanticColors.fg,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  text: {
    ...typography.bodyMd,
    fontFamily: fontFamilies.sans,
    color: semanticColors.fgSecondary,
  },
  reportButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xxs,
  },
  reportLabel: {
    ...typography.labelMd,
    fontFamily: fontFamilies.sansMedium,
    color: semanticColors.fgTertiary,
  },
});
