import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { tokens } from "@suliv/design-system";
import { AllergenWarningIcon } from "../atoms/AllergenWarningIcon";

interface IngredientRowProps {
  quantity: string;
  unit: string;
  name: string;
  optional: boolean;
  isAllergen: boolean;
}

export function IngredientRow({ quantity, unit, name, optional, isAllergen }: IngredientRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.quantity}>
        {quantity} {unit}
      </Text>
      <View style={styles.nameGroup}>
        <Text style={[styles.name, isAllergen && styles.allergenName]}>
          {name}
        </Text>
        {optional && <Text style={styles.optional}> (opcional)</Text>}
        {isAllergen && <AllergenWarningIcon size={14} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: tokens.spacing.xs,
    gap: tokens.spacing.md,
  },
  quantity: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.textPrimary,
    fontWeight: tokens.typography.fontWeights.medium,
    minWidth: 80,
  },
  nameGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.xs,
    flexWrap: "wrap",
  },
  name: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.textPrimary,
  },
  allergenName: {
    color: tokens.colors.error,
    fontWeight: tokens.typography.fontWeights.medium,
  },
  optional: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.textPrimary,
    opacity: 0.6,
  },
});
