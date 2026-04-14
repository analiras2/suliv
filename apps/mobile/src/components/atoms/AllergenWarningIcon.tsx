import React from "react";
import { StyleSheet, Text } from "react-native";
import { tokens } from "@suliv/design-system";

interface AllergenWarningIconProps {
  size?: number;
}

export function AllergenWarningIcon({ size = 16 }: AllergenWarningIconProps) {
  return (
    <Text
      style={[styles.icon, { fontSize: size }]}
      accessibilityLabel="Contém alérgeno"
      accessibilityRole="image"
    >
      ⚠
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    color: tokens.colors.error,
    lineHeight: undefined,
  },
});
