import { fetchWithAuth, handleResponse } from "./authApi";
import { getRecipes } from "./recipesApi";
import type { FeedResponse } from "../features/recipes/types/feed";
import type { FeedNewsItem } from "../features/recipes/types/feed";

interface NewsListResponse {
  data: FeedNewsItem[];
}

function buildFallbackFeed(
  recipeItems: Awaited<ReturnType<typeof getRecipes>>["data"],
  newsItems: FeedNewsItem[],
): FeedResponse {
  const categoriesMap = new Map<string, number>();

  for (const recipe of recipeItems) {
    categoriesMap.set(recipe.category, (categoriesMap.get(recipe.category) ?? 0) + 1);
  }

  const categories = [...categoriesMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, recipeCount]) => ({ key, recipeCount }));

  const topRecipesSource = [...recipeItems]
    .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite))
    .slice(0, 5);

  return {
    dailyRecipes: recipeItems.slice(0, 5).map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      category: recipe.category,
      imageUrl: recipe.imageUrl,
      tag: recipe.tags[0] ?? "Receita do dia",
      totalTimeMin: recipe.prepTimeMin + recipe.cookTimeMin,
      descriptor: recipe.tags[1] ?? recipe.category,
    })),
    categories,
    news: newsItems,
    topRecipes: topRecipesSource.map((recipe, index) => ({
      id: recipe.id,
      rank: index + 1,
      title: recipe.title,
      category: recipe.category,
      imageUrl: recipe.imageUrl,
      totalTimeMin: recipe.prepTimeMin + recipe.cookTimeMin,
      descriptor: recipe.tags[0] ?? recipe.category,
      savesCount: recipe.isFavorite ? 1 : 0,
    })),
  };
}

export async function getFeed(): Promise<FeedResponse> {
  try {
    const res = await fetchWithAuth("/api/feed", { method: "GET" });
    return await handleResponse<FeedResponse>(res);
  } catch {
    const [recipes, news] = await Promise.all([
      getRecipes({ limit: 10 }),
      (async () => {
        try {
          const res = await fetchWithAuth("/api/news?limit=3", { method: "GET" });
          return await handleResponse<NewsListResponse>(res);
        } catch {
          return { data: [] };
        }
      })(),
    ]);

    return buildFallbackFeed(recipes.data, news.data);
  }
}
