import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
      <MaterialCommunityIcons
        name={isFavorite ? "heart" : "heart-outline"}
        size={24}
        color={isFavorite ? tokens.colors.primary : tokens.colors.textPrimary}
      />
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
});
