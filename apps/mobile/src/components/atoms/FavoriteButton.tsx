import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { tokens } from "@suliv/design-system";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  isLoading?: boolean;
  accessibilityLabel: string;
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  isLoading = false,
  accessibilityLabel,
}: FavoriteButtonProps) {
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.button, isLoading && styles.loading]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ checked: isFavorite }}
      hitSlop={8}
    >
      <Text style={[styles.icon, isFavorite && styles.iconActive]}>
        {isFavorite ? "★" : "☆"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: tokens.spacing.xs,
  },
  loading: {
    opacity: 0.6,
  },
  icon: {
    fontSize: 22,
    color: tokens.colors.textPrimary,
  },
  iconActive: {
    color: tokens.colors.primary,
  },
});
