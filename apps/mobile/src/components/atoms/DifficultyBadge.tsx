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
  BEGINNER: tokens.color.semantic.feedback.successSoft,
  INTERMEDIATE: tokens.color.semantic.feedback.warningSoft,
  ADVANCED: tokens.color.semantic.feedback.errorSoft,
};

const TEXT_COLOR: Record<Difficulty, string> = {
  BEGINNER: tokens.color.semantic.feedback.success,
  INTERMEDIATE: tokens.color.semantic.feedback.warning,
  ADVANCED: tokens.color.semantic.feedback.error,
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
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: tokens.space.xs,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: tokens.typography.scale.label.md.fontSize,
    lineHeight: tokens.typography.scale.label.md.lineHeight,
    fontWeight: tokens.typography.weight.medium,
  },
});
