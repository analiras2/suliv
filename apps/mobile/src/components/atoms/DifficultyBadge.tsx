import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { tokens } from "@suliv/design-system";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

const LABEL: Record<Difficulty, string> = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Médio",
  ADVANCED: "Avançado",
};

const BG_COLOR: Record<Difficulty, string> = {
  BEGINNER: "#E8F5E0",
  INTERMEDIATE: "#FFF3CD",
  ADVANCED: "#FDECEA",
};

const TEXT_COLOR: Record<Difficulty, string> = {
  BEGINNER: "#4A8C2A",
  INTERMEDIATE: "#8A6000",
  ADVANCED: "#C0392B",
};

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: BG_COLOR[difficulty] }]}>
      <Text style={[styles.label, { color: TEXT_COLOR[difficulty] }]}>
        {LABEL[difficulty]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: tokens.borderRadius.lg,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: tokens.typography.fontSizes.sm,
    fontWeight: tokens.typography.fontWeights.medium,
  },
});
