import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import useSWR from "swr";
import { tokens } from "@suliv/design-system";
import { FavoriteToggle } from "../../../components/atoms/FavoriteToggle";
import { PortionControl } from "../../../components/atoms/PortionControl";
import { RecipeIngredientList } from "../../../components/organisms/RecipeIngredientList";
import { RecipeStepList } from "../../../components/organisms/RecipeStepList";
import { useFavorite } from "../hooks/useFavorite";
import { getRecipeDetail } from "../../../services/recipesApi";
import type { AppStackParamList } from "../../../navigation/types";

type RouteProps = RouteProp<AppStackParamList, "RecipeDetail">;
type NavProps = NativeStackNavigationProp<AppStackParamList, "RecipeDetail">;

const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Médio",
  ADVANCED: "Avançado",
};

const CATEGORY_LABELS: Record<string, string> = {
  cafe: "Café",
  almoco: "Almoço",
  jantar: "Jantar",
  lanche: "Lanche",
  sobremesa: "Sobremesa",
};

export function RecipeDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();
  const { id } = route.params;

  const [selectedServings, setSelectedServings] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const { data, isLoading, error } = useSWR(
    `recipe-detail:${id}`,
    () => getRecipeDetail(id),
    { revalidateOnFocus: false },
  );

  const baseServings = data?.recipe.servings ?? 1;
  const portions = selectedServings ?? baseServings;

  const { isFavorite, toggle, isLoading: isFavLoading } = useFavorite(
    id,
    data?.isFavorite ?? false,
  );

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : "Receita não encontrada."}
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const { recipe } = data;
  const totalMin = recipe.prepTimeMin + recipe.cookTimeMin;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Back button row */}
      <View style={styles.navBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={8}
          style={styles.backPressable}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={tokens.colors.primary}
          />
          <Text style={styles.backLabel}>Voltar</Text>
        </Pressable>
        <FavoriteToggle
          isFavorite={isFavorite}
          onToggle={toggle}
          isLoading={isFavLoading}
          accessibilityLabel={
            isFavorite
              ? `Remover ${recipe.title} dos favoritos`
              : `Salvar ${recipe.title} nos favoritos`
          }
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero image */}
        {recipe.imageUrl && !imageFailed ? (
          <Image
            source={{ uri: recipe.imageUrl }}
            style={[styles.heroImage, !imageLoaded && styles.heroImagePlaceholder]}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.heroImagePlaceholder} />
        )}

        <View style={styles.body}>
          {/* Title + meta */}
          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.meta}>
            {totalMin} min · {DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty} ·{" "}
            {CATEGORY_LABELS[recipe.category] ?? recipe.category}
          </Text>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <View style={styles.tags}>
              {recipe.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Nutrition (if available) */}
          {recipe.nutritionPerServing && (
            <View style={styles.nutritionRow}>
              <NutritionChip label="Cal" value={recipe.nutritionPerServing.calories} unit="" />
              <NutritionChip label="Prot" value={recipe.nutritionPerServing.proteinG} unit="g" />
              <NutritionChip label="Carb" value={recipe.nutritionPerServing.carbsG} unit="g" />
              <NutritionChip label="Gord" value={recipe.nutritionPerServing.fatG} unit="g" />
              <NutritionChip label="Fibra" value={recipe.nutritionPerServing.fiberG} unit="g" />
            </View>
          )}

          {/* Portion control */}
          <View style={styles.portionRow}>
            <Text style={styles.portionLabel}>Porções</Text>
            <PortionControl
              value={portions}
              min={1}
              max={20}
              onDecrement={() => setSelectedServings(Math.max(1, portions - 1))}
              onIncrement={() => setSelectedServings(Math.min(20, portions + 1))}
            />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Ingredients */}
          <RecipeIngredientList
            ingredients={recipe.ingredients}
            selectedServings={portions}
            baseServings={baseServings}
          />

          {/* Divider */}
          <View style={styles.divider} />

          {/* Steps */}
          <RecipeStepList steps={recipe.steps} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// NutritionChip
// ---------------------------------------------------------------------------

function NutritionChip({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <View style={styles.nutritionChip}>
      <Text style={styles.nutritionValue}>
        {Math.round(value)}
        {unit}
      </Text>
      <Text style={styles.nutritionLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacing.xl,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.background,
  },
  backPressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backLabel: {
    fontSize: tokens.typography.fontSizes.md,
    color: tokens.colors.primary,
  },
  scrollContent: {
    paddingBottom: tokens.spacing["2xl"],
  },
  heroImage: {
    width: "100%",
    height: 240,
  },
  heroImagePlaceholder: {
    width: "100%",
    height: 240,
    backgroundColor: tokens.colors.background,
  },
  body: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  title: {
    fontSize: tokens.typography.fontSizes.xl,
    fontWeight: tokens.typography.fontWeights.bold,
    color: tokens.colors.textPrimary,
    lineHeight: 32,
  },
  meta: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.textPrimary + "99",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.xs,
  },
  tag: {
    backgroundColor: tokens.colors.primary + "1A",
    borderRadius: tokens.borderRadius.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.primary,
    fontWeight: tokens.typography.fontWeights.medium,
  },
  nutritionRow: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
    flexWrap: "wrap",
  },
  nutritionChip: {
    flex: 1,
    minWidth: 52,
    alignItems: "center",
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.sm,
    paddingVertical: tokens.spacing.sm,
  },
  nutritionValue: {
    fontSize: tokens.typography.fontSizes.sm,
    fontWeight: tokens.typography.fontWeights.semibold,
    color: tokens.colors.textPrimary,
  },
  nutritionLabel: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.textPrimary + "88",
  },
  portionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  portionLabel: {
    fontSize: tokens.typography.fontSizes.md,
    fontWeight: tokens.typography.fontWeights.semibold,
    color: tokens.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.background,
    marginVertical: tokens.spacing.sm,
  },
  errorText: {
    fontSize: tokens.typography.fontSizes.md,
    color: tokens.colors.error,
    textAlign: "center",
    marginBottom: tokens.spacing.lg,
  },
  backButton: {
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md,
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.borderRadius.md,
  },
  backButtonText: {
    fontSize: tokens.typography.fontSizes.md,
    fontWeight: tokens.typography.fontWeights.semibold,
    color: tokens.colors.surface,
  },
});
