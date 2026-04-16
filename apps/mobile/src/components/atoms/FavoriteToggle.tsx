import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { tokens } from "@suliv/design-system";

interface FavoriteToggleProps {
  isFavorite: boolean;
  onToggle: () => void;
  isLoading?: boolean;
  accessibilityLabel: string;
}

export function FavoriteToggle({
  isFavorite,
  onToggle,
  isLoading = false,
  accessibilityLabel,
}: FavoriteToggleProps) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.button,
        isFavorite && styles.buttonActive,
        pressed && !isLoading && styles.pressed,
        isLoading && styles.loading,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ checked: isFavorite, disabled: isLoading }}
      hitSlop={8}
      disabled={isLoading}
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons
          name={isFavorite ? "heart" : "heart-outline"}
          size={20}
          color={
            isFavorite
              ? tokens.color.semantic.special.favoriteActive
              : tokens.color.semantic.text.secondary
          }
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.color.semantic.surface.elevated,
    borderWidth: 1,
    borderColor: tokens.color.semantic.border.subtle,
  },
  buttonActive: {
    backgroundColor: tokens.color.semantic.special.favoriteSoft,
    borderColor: tokens.color.semantic.special.favoriteSoft,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.92,
  },
  loading: {
    opacity: 0.6,
  },
});
