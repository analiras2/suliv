import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { tokens } from "@suliv/design-system";
import { CategoryBadge } from "../atoms/CategoryBadge";
import { DifficultyBadge } from "../atoms/DifficultyBadge";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type Category = "cafe" | "almoco" | "jantar" | "lanche" | "sobremesa";

interface RecipeCardMetaProps {
  prepTimeMin: number;
  cookTimeMin: number;
  difficulty: Difficulty;
  category: Category;
}

export function RecipeCardMeta({
  prepTimeMin,
  cookTimeMin,
  difficulty,
  category,
}: RecipeCardMetaProps) {
  const totalMin = prepTimeMin + cookTimeMin;
  const timeLabel = totalMin >= 60
    ? `${Math.floor(totalMin / 60)}h${totalMin % 60 > 0 ? ` ${totalMin % 60}min` : ""}`
    : `${totalMin} min`;

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{timeLabel}</Text>
      <DifficultyBadge difficulty={difficulty} />
      <CategoryBadge category={category} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacing.xs,
  },
  time: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.textPrimary,
    fontWeight: tokens.typography.fontWeights.medium,
  },
});
