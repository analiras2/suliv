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
    borderRadius: tokens.borderRadius.lg,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    backgroundColor: "#EAF0FB",
    alignSelf: "flex-start",
  },
  label: {
    fontSize: tokens.typography.fontSizes.sm,
    fontWeight: tokens.typography.fontWeights.medium,
    color: "#2C5BB4",
  },
});
