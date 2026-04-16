import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { tokens } from "@suliv/design-system";
import { Chip } from "../atoms/Chip";

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
            <Chip
              key={opt.value}
              label={opt.label}
              selected={isSelected}
              onPress={() => onSelect(isSelected ? null : opt.value)}
            />
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
});
