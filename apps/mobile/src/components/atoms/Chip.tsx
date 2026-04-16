import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { tokens } from "@suliv/design-system";

type ChipVariant = "filter" | "input";

interface ChipProps extends Omit<PressableProps, "style"> {
  label: string;
  selected?: boolean;
  variant?: ChipVariant;
  style?: StyleProp<ViewStyle>;
}

export function Chip({
  label,
  selected = false,
  variant = "filter",
  style,
  ...props
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.base,
        variant === "input" ? styles.input : styles.filter,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelDefault]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  filter: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.xs,
  },
  input: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
  },
  selected: {
    backgroundColor: tokens.color.semantic.brand.primary,
    borderColor: tokens.color.semantic.brand.primary,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    fontSize: tokens.typography.scale.label.md.fontSize,
    lineHeight: tokens.typography.scale.label.md.lineHeight,
    fontWeight: tokens.typography.weight.medium,
  },
  labelDefault: {
    color: tokens.color.semantic.brand.primary,
  },
  labelSelected: {
    color: tokens.color.semantic.text.inverse,
  },
});
