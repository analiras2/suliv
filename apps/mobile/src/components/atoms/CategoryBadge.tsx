import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { tokens } from "@suliv/design-system";

type Category = "cafe" | "almoco" | "jantar" | "lanche" | "sobremesa";

interface CategoryBadgeProps {
  category: Category;
}

const LABEL: Record<Category, string> = {
  cafe: "Café",
  almoco: "Almoço",
  jantar: "Jantar",
  lanche: "Lanche",
  sobremesa: "Sobremesa",
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{LABEL[category] ?? category}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: tokens.space.xs,
    backgroundColor: tokens.color.semantic.surface.subtle,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: tokens.typography.scale.label.md.fontSize,
    lineHeight: tokens.typography.scale.label.md.lineHeight,
    fontWeight: tokens.typography.weight.medium,
    color: tokens.color.semantic.text.secondary,
  },
});
