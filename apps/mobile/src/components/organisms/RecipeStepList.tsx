import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { tokens } from "@suliv/design-system";
import { RecipeStepItem } from "../molecules/RecipeStepItem";

interface RecipeStep {
  id: string;
  order: number;
  instruction: string;
  timerSeconds: number | null;
}

interface RecipeStepListProps {
  steps: RecipeStep[];
}

export function RecipeStepList({ steps }: RecipeStepListProps) {
  const sorted = [...steps].sort((a, b) => a.order - b.order);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Modo de preparo</Text>
      {sorted.map((step) => (
        <RecipeStepItem
          key={step.id}
          order={step.order}
          instruction={step.instruction}
          timerSeconds={step.timerSeconds}
        />
      ))}
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
