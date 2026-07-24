import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/atoms/icon';
import { colors, spacing } from '@/design-system/tokens';

export type RatingStarsPickerProps = {
  onRate: (stars: number) => void;
  initialValue?: number;
};

const STAR_VALUES = [1, 2, 3, 4, 5];

export function RatingStarsPicker({ onRate, initialValue }: RatingStarsPickerProps) {
  const [selected, setSelected] = useState<number | null>(initialValue ?? null);

  return (
    <View style={styles.row} testID="rating-stars-picker">
      {STAR_VALUES.map((value) => {
        const isFilled = selected != null && value <= selected;
        return (
          <Pressable
            key={value}
            accessibilityLabel={`Avaliar com ${value} estrelas`}
            testID={`rating-star-${value}`}
            hitSlop={6}
            onPress={() => {
              setSelected(value);
              onRate(value);
            }}>
            <Icon name="star" size={28} color={colors.clay500} strokeWidth={1.8} filled={isFilled} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
