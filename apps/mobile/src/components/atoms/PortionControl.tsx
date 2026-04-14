import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { tokens } from "@suliv/design-system";

interface PortionControlProps {
  value: number;
  min?: number;
  max?: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function PortionControl({
  value,
  min = 1,
  max = 20,
  onIncrement,
  onDecrement,
}: PortionControlProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onDecrement}
        disabled={value <= min}
        style={[styles.button, value <= min && styles.disabled]}
        accessibilityLabel="Diminuir porções"
        accessibilityRole="button"
        hitSlop={8}
      >
        <Text style={styles.buttonText}>−</Text>
      </Pressable>

      <Text style={styles.value}>{value}</Text>

      <Pressable
        onPress={onIncrement}
        disabled={value >= max}
        style={[styles.button, value >= max && styles.disabled]}
        accessibilityLabel="Aumentar porções"
        accessibilityRole="button"
        hitSlop={8}
      >
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: tokens.borderRadius.sm,
    borderWidth: 1,
    borderColor: tokens.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.35,
  },
  buttonText: {
    fontSize: tokens.typography.fontSizes.lg,
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeights.medium,
    lineHeight: 20,
  },
  value: {
    fontSize: tokens.typography.fontSizes.md,
    fontWeight: tokens.typography.fontWeights.semibold,
    color: tokens.colors.textPrimary,
    minWidth: 24,
    textAlign: "center",
  },
});
