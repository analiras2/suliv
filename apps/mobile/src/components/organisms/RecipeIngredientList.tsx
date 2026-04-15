import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { tokens } from "@suliv/design-system";
import { formatFraction } from "../../utils/fraction";
import { IngredientRow } from "../molecules/IngredientRow";

interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  optional: boolean;
  isAllergen: boolean;
}

interface RecipeIngredientListProps {
  ingredients: RecipeIngredient[];
  selectedServings: number;
  baseServings: number;
}

export function RecipeIngredientList({
  ingredients,
  selectedServings,
  baseServings,
}: RecipeIngredientListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Ingredientes</Text>
      {ingredients.map((ingredient) => {
        const scaledQty =
          (ingredient.quantity * selectedServings) / baseServings;
        return (
          <IngredientRow
            key={ingredient.id}
            quantity={formatFraction(scaledQty)}
            unit={ingredient.unit}
            name={ingredient.name}
            optional={ingredient.optional}
            isAllergen={ingredient.isAllergen}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.xs,
  },
  sectionTitle: {
    fontSize: tokens.typography.fontSizes.lg,
    fontWeight: tokens.typography.fontWeights.semibold,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.spacing.xs,
  },
});
