import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { tokens } from "@suliv/design-system";
import { CategoryBadge } from "../atoms/CategoryBadge";
import { DifficultyBadge } from "../atoms/DifficultyBadge";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type Category = "cafe" | "almoco" | "jantar" | "lanche" | "sobremesa";

interface RecipeMetaRowProps {
  prepTimeMin: number;
  cookTimeMin: number;
  difficulty: Difficulty;
  category: Category;
}

function formatTotalTime(totalMin: number) {
  return totalMin >= 60
    ? `${Math.floor(totalMin / 60)}h${totalMin % 60 > 0 ? ` ${totalMin % 60}min` : ""}`
    : `${totalMin} min`;
}

export function RecipeMetaRow({
  prepTimeMin,
  cookTimeMin,
  difficulty,
  category,
}: RecipeMetaRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.timePill}>
        <Text style={styles.timeText}>{formatTotalTime(prepTimeMin + cookTimeMin)}</Text>
      </View>
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
    gap: tokens.space.xs,
  },
  timePill: {
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: tokens.space.xs,
    backgroundColor: tokens.color.semantic.surface.subtle,
  },
  timeText: {
    fontSize: tokens.typography.scale.label.md.fontSize,
    lineHeight: tokens.typography.scale.label.md.lineHeight,
    color: tokens.color.semantic.text.secondary,
    fontWeight: tokens.typography.weight.medium,
  },
});
