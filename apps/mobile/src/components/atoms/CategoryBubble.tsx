import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { tokens } from "@suliv/design-system";

interface CategoryBubbleProps {
  label: string;
  bgColor: string;
  iconName: string;
  onPress?: () => void;
}

export function CategoryBubble({ label, bgColor, iconName, onPress }: CategoryBubbleProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Pressable style={[styles.circle, { backgroundColor: bgColor }]} onPress={onPress}>
        <MaterialCommunityIcons
          name={iconName as any}
          size={32}
          color={tokens.color.primitive.sand[25]}
        />
      </Pressable>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: tokens.space.xs,
    width: 76,
  },
  circle: {
    width: 76,
    height: 76,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: tokens.color.semantic.border.subtle,
    ...tokens.elevation.sm,
  },
  label: {
    fontSize: tokens.typography.scale.caption.md.fontSize,
    lineHeight: tokens.typography.scale.caption.md.lineHeight,
    fontFamily: tokens.typography.family.medium,
    fontWeight: "500",
    color: tokens.color.semantic.text.secondary,
    textAlign: "center",
  },
});
