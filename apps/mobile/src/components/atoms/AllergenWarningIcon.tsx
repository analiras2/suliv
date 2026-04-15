import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { tokens } from "@suliv/design-system";

interface AllergenWarningIconProps {
  size?: number;
}

export function AllergenWarningIcon({ size = 16 }: AllergenWarningIconProps) {
  return (
    <MaterialCommunityIcons
      name="alert-circle"
      size={size}
      color={tokens.colors.error}
      accessibilityLabel="Contém alérgeno"
      accessibilityRole="image"
    />
  );
}
