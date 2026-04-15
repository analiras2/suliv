import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { tokens } from "@suliv/design-system";

interface RecipeStepItemProps {
  order: number;
  instruction: string;
  timerSeconds: number | null;
}

function formatTimer(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${m > 0 ? ` ${m}min` : ""}`;
  return s > 0 ? `${m}min ${s}s` : `${m} min`;
}

export function RecipeStepItem({ order, instruction, timerSeconds }: RecipeStepItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.orderBadge}>
        <Text style={styles.orderText}>{order}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.instruction}>{instruction}</Text>
        {timerSeconds != null && timerSeconds > 0 && (
          <View style={styles.timerBadge}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={14}
              color="#8A6000"
              style={styles.timerIcon}
            />
            <Text style={styles.timerText}>{formatTimer(timerSeconds)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: tokens.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  orderText: {
    fontSize: tokens.typography.fontSizes.sm,
    fontWeight: tokens.typography.fontWeights.bold,
    color: tokens.colors.surface,
  },
  content: {
    flex: 1,
    gap: tokens.spacing.xs,
  },
  instruction: {
    fontSize: tokens.typography.fontSizes.md,
    color: tokens.colors.textPrimary,
    lineHeight: 22,
  },
  timerBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3CD",
    borderRadius: tokens.borderRadius.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
  },
  timerIcon: {
    lineHeight: undefined,
  },
  timerText: {
    fontSize: tokens.typography.fontSizes.sm,
    color: "#8A6000",
    fontWeight: tokens.typography.fontWeights.medium,
  },
});
