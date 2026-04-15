import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { tokens } from "@suliv/design-system";
import { RecipeCard } from "../../../components/organisms/RecipeCard";
import { FilterSheet, type ActiveFilters } from "../../../components/organisms/FilterSheet";
import { useRecipes } from "../hooks/useRecipes";
import { useFavorite } from "../hooks/useFavorite";
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll";
import type { AppStackParamList } from "../../../navigation/types";

type FeedNavProp = NativeStackNavigationProp<AppStackParamList, "Feed">;

const EMPTY_FILTERS: ActiveFilters = {
  maxTime: null,
  difficulty: null,
  category: null,
  mainIngredient: null,
};

function countActive(f: ActiveFilters): number {
  return [f.maxTime, f.difficulty, f.category, f.mainIngredient].filter(
    (v) => v != null && v !== "",
  ).length;
}

// ---------------------------------------------------------------------------
// Single-recipe row wrapper — mounts useFavorite per card
// ---------------------------------------------------------------------------

interface RecipeRowProps {
  recipe: {
    id: string;
    title: string;
    slug: string;
    imageUrl: string | null;
    prepTimeMin: number;
    cookTimeMin: number;
    difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    category: string;
    tags: string[];
    servings: number;
    isFavorite: boolean;
  };
  onPress: (id: string) => void;
}

function RecipeRow({ recipe, onPress }: RecipeRowProps) {
  const { isFavorite, toggle } = useFavorite(recipe.id, recipe.isFavorite);
  return (
    <RecipeCard
      recipe={recipe as Parameters<typeof RecipeCard>[0]["recipe"]}
      isFavorite={isFavorite}
      onPress={() => onPress(recipe.id)}
      onFavoriteToggle={toggle}
    />
  );
}

// ---------------------------------------------------------------------------
// FeedScreen
// ---------------------------------------------------------------------------

export function FeedScreen() {
  const navigation = useNavigation<FeedNavProp>();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  const { recipes, isLoading, isFetchingMore, hasMore, error, fetchMore, refresh } =
    useRecipes({ searchQuery, filters });

  const { onEndReached } = useInfiniteScroll(fetchMore, {
    isLoading: isFetchingMore,
    hasMore,
  });

  const handleNavigateToDetail = useCallback(
    (id: string) => {
      navigation.navigate("RecipeDetail", { id });
    },
    [navigation],
  );

  const handleApplyFilters = useCallback((applied: ActiveFilters) => {
    setFilters(applied);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
  }, []);

  const activeCount = countActive(filters);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={refresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Search + Filter bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar receitas…"
          placeholderTextColor={tokens.colors.textPrimary + "66"}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
        />
        <Pressable
          onPress={() => setFilterSheetVisible(true)}
          style={[styles.filterButton, activeCount > 0 && styles.filterButtonActive]}
          accessibilityRole="button"
          accessibilityLabel={
            activeCount > 0 ? `Filtros, ${activeCount} ativos` : "Abrir filtros"
          }
        >
          <Text
            style={[
              styles.filterButtonText,
              activeCount > 0 && styles.filterButtonTextActive,
            ]}
          >
            {activeCount > 0 ? `Filtros (${activeCount})` : "Filtros"}
          </Text>
        </Pressable>
      </View>

      {/* Recipe list */}
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeRow recipe={item} onPress={handleNavigateToDetail} />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        onRefresh={refresh}
        refreshing={isLoading && recipes.length === 0}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator
              size="large"
              color={tokens.colors.primary}
              style={styles.loader}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhuma receita encontrada</Text>
              <Text style={styles.emptySubtitle}>
                Tente ajustar os filtros ou a busca.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingMore ? (
            <ActivityIndicator
              size="small"
              color={tokens.colors.primary}
              style={styles.footerLoader}
            />
          ) : null
        }
      />

      {/* Filter Sheet */}
      <FilterSheet
        filters={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
      />
    </SafeAreaView>
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.background,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.borderRadius.sm,
    paddingHorizontal: tokens.spacing.md,
    fontSize: tokens.typography.fontSizes.md,
    color: tokens.colors.textPrimary,
  },
  filterButton: {
    height: 40,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.borderRadius.sm,
    borderWidth: 1,
    borderColor: tokens.colors.textPrimary + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.primary + "1A",
  },
  filterButtonText: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.textPrimary,
    fontWeight: tokens.typography.fontWeights.medium,
  },
  filterButtonTextActive: {
    color: tokens.colors.primary,
  },
  listContent: {
    padding: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl,
  },
  separator: {
    height: tokens.spacing.md,
  },
  loader: {
    marginTop: tokens.spacing["2xl"],
  },
  footerLoader: {
    marginVertical: tokens.spacing.lg,
  },
  emptyState: {
    marginTop: tokens.spacing["2xl"],
    alignItems: "center",
    gap: tokens.spacing.sm,
  },
  emptyTitle: {
    fontSize: tokens.typography.fontSizes.lg,
    fontWeight: tokens.typography.fontWeights.semibold,
    color: tokens.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: tokens.typography.fontSizes.sm,
    color: tokens.colors.textPrimary + "99",
    textAlign: "center",
  },
  errorText: {
    fontSize: tokens.typography.fontSizes.md,
    color: tokens.colors.error,
    textAlign: "center",
    marginBottom: tokens.spacing.lg,
  },
  retryButton: {
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md,
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.borderRadius.md,
  },
  retryText: {
    fontSize: tokens.typography.fontSizes.md,
    fontWeight: tokens.typography.fontWeights.semibold,
    color: tokens.colors.surface,
  },
});
