import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { tokens } from "@suliv/design-system";
import { FeedHeader } from "../../../components/organisms/FeedHeader";
import { DailyCarousel } from "../../../components/organisms/DailyCarousel";
import { CategoriesSection } from "../../../components/organisms/CategoriesSection";
import { NewsSection } from "../../../components/organisms/NewsSection";
import { TopRecipesSection } from "../../../components/organisms/TopRecipesSection";
import { BottomNav, type FeedTab } from "../../../components/organisms/BottomNav";
import type { AppStackParamList } from "../../../navigation/types";
import { useFeed } from "../hooks/useFeed";

type FeedNavProp = NativeStackNavigationProp<AppStackParamList, "Feed">;

export function FeedScreen() {
  const navigation = useNavigation<FeedNavProp>();
  const [activeTab, setActiveTab] = useState<FeedTab>("feed");
  const { feed, isLoading, error } = useFeed();

  const handleRecipePress = useCallback(
    (id: string) => {
      navigation.navigate("RecipeDetail", { id });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <FeedHeader />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !feed ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="small" color={tokens.color.primitive.moss[600]} />
          </View>
        ) : null}

        {error && !feed ? (
          <View style={styles.centeredState}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <DailyCarousel items={feed?.dailyRecipes ?? []} onCardPress={handleRecipePress} />
        <CategoriesSection categories={feed?.categories ?? []} />
        <NewsSection items={feed?.news ?? []} />
        <TopRecipesSection items={feed?.topRecipes ?? []} onRecipePress={handleRecipePress} />
        <View style={styles.bottomSpacer} />
      </ScrollView>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.color.semantic.surface.base,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: tokens.space.xs,
    gap: tokens.space["2xl"],
  },
  centeredState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.lg,
  },
  errorText: {
    color: tokens.color.semantic.text.secondary,
    textAlign: "center",
  },
  bottomSpacer: {
    height: tokens.space.xl,
  },
});
