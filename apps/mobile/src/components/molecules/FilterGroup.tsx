import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { tokens } from "@suliv/design-system";

interface Option {
  value: string;
  label: string;
}

interface FilterGroupProps {
  label: string;
  options: Option[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}

export function FilterGroup({ label, options, selected, onSelect }: FilterGroupProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {options.map((opt) => {
          const isSelected = opt.value === selected;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(isSelected ? null : opt.value)}
              style={[styles.chip, isSelected && styles.chipSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.sm,
  },
  label: {
    fontSize: tokens.typography.fontSizes.sm,
    fontWeight: tokens.typography.fontWeights.semibold,
    color: tokens.colors.textPrimary,
  },
  chips: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
    paddingBottom: tokens.spacing.xs,
  },
  chip: {
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.textPrimary,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
  },
  chipSelected: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  chipText: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.textPrimary,
    fontWeight: tokens.typography.fontWeights.regular,
  },
  chipTextSelected: {
    color: tokens.colors.surface,
    fontWeight: tokens.typography.fontWeights.medium,
  },
});
