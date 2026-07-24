import { StyleSheet, Text, View } from 'react-native';

import { OptionCard } from '@/components/molecules/option-card';
import { fontFamilies, semanticColors, spacing, typography } from '@/design-system/tokens';
import type { IconName } from '@/components/atoms/icon';

export type RecipeOptionPickerOption<T extends string> = {
  value: T;
  label: string;
  icon: IconName;
};

export type RecipeOptionPickerProps<T extends string> = {
  label: string;
  options: readonly RecipeOptionPickerOption<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
  testID?: string;
};

export function RecipeOptionPicker<T extends string>({
  label,
  options,
  selected,
  onSelect,
  testID,
}: RecipeOptionPickerProps<T>) {
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => (
          <OptionCard
            key={option.value}
            icon={option.icon}
            title={option.label}
            selected={selected === option.value}
            selectionMode="single"
            onPress={() => onSelect(option.value)}
            accessibilityLabel={option.label}
            testID={`${testID}-${option.value}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.labelMd,
    fontFamily: fontFamilies.sansMedium,
    color: semanticColors.fgSecondary,
  },
  options: {
    gap: spacing.xs,
  },
});
