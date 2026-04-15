import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { tokens } from "@suliv/design-system";
import { FavoriteButton } from "../atoms/FavoriteButton";
import { RecipeCardMeta } from "../molecules/RecipeCardMeta";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type Category = "cafe" | "almoco" | "jantar" | "lanche" | "sobremesa";

interface RecipeCardData {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  prepTimeMin: number;
  cookTimeMin: number;
  difficulty: Difficulty;
  category: Category;
  tags: string[];
  servings: number;
}

interface RecipeCardProps {
  recipe: RecipeCardData;
  isFavorite: boolean;
  onPress: () => void;
  onFavoriteToggle: () => void;
}

export function RecipeCard({ recipe, isFavorite, onPress, onFavoriteToggle }: RecipeCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Receita: ${recipe.title}`}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {recipe.imageUrl && !imageFailed ? (
          <Image
            source={{ uri: recipe.imageUrl }}
            style={[styles.image, !imageLoaded && styles.imagePlaceholder]}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          <FavoriteButton
            isFavorite={isFavorite}
            onToggle={onFavoriteToggle}
            accessibilityLabel={
              isFavorite
                ? `Remover ${recipe.title} dos favoritos`
                : `Salvar ${recipe.title} nos favoritos`
            }
          />
        </View>
        <RecipeCardMeta
          prepTimeMin={recipe.prepTimeMin}
          cookTimeMin={recipe.cookTimeMin}
          difficulty={recipe.difficulty}
          category={recipe.category}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.md,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.92,
  },
  imageContainer: {
    height: 160,
    width: "100%",
    backgroundColor: tokens.colors.background,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: tokens.colors.background,
  },
  content: {
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: tokens.typography.fontSizes.md,
    fontWeight: tokens.typography.fontWeights.semibold,
    color: tokens.colors.textPrimary,
    lineHeight: 22,
  },
});
