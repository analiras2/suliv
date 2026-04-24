import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { tokens } from "@suliv/design-system";

const P = tokens.color.primitive;

interface SectionHeaderProps {
  kicker?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ kicker, title, action, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View>
        {kicker && (
          <Text style={styles.kicker}>{kicker.toUpperCase()}</Text>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      {action && (
        <Pressable
          onPress={onAction}
          style={styles.actionBtn}
          accessibilityRole="button"
          accessibilityLabel={action}
        >
          <Text style={styles.actionText}>{action}</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={P.moss[600]} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: tokens.space.md,
  },
  kicker: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: tokens.typography.family.semibold,
    fontWeight: "600",
    letterSpacing: 1.54,
    color: P.moss[600],
    marginBottom: tokens.space["2xs"],
  },
  title: {
    fontFamily: tokens.typography.family.displayMedium,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "500",
    letterSpacing: -0.3,
    color: tokens.color.semantic.text.primary,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingBottom: 2,
  },
  actionText: {
    fontFamily: tokens.typography.family.semibold,
    fontSize: 13,
    fontWeight: "600",
    color: P.moss[600],
  },
});
