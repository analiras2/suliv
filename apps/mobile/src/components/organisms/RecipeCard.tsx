import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { tokens } from "@suliv/design-system";
import { FavoriteToggle } from "../atoms/FavoriteToggle";
import { RecipeMetaRow } from "../molecules/RecipeMetaRow";

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
          <FavoriteToggle
            isFavorite={isFavorite}
            onToggle={onFavoriteToggle}
            accessibilityLabel={
              isFavorite
                ? `Remover ${recipe.title} dos favoritos`
                : `Salvar ${recipe.title} nos favoritos`
            }
          />
        </View>
        <RecipeMetaRow
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
    backgroundColor: tokens.color.semantic.surface.elevated,
    borderRadius: tokens.radius.md,
    overflow: "hidden",
    ...tokens.elevation.md,
  },
  pressed: {
    opacity: 0.92,
  },
  imageContainer: {
    height: 160,
    width: "100%",
    backgroundColor: tokens.color.semantic.surface.subtle,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: tokens.color.semantic.surface.subtle,
  },
  content: {
    padding: tokens.space.md,
    gap: tokens.space.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.space.sm,
  },
  title: {
    flex: 1,
    fontSize: tokens.typography.scale.title.md.fontSize,
    lineHeight: tokens.typography.scale.title.md.lineHeight,
    fontWeight: tokens.typography.weight.semibold,
    color: tokens.color.semantic.text.primary,
  },
});
