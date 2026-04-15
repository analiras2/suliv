import { Suspense } from "react";
import { getRecipes, type RecipeQueryParams } from "../../lib/recipesApi";
import { FeedClient } from "./FeedClient";

interface FeedPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    difficulty?: string;
    maxTime?: string;
    mainIngredient?: string;
    page?: string;
  }>;
}

function FeedSkeleton() {
  return (
    <div style={{ padding: "1rem" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            border: "1px solid #eee",
            borderRadius: 8,
            background: "#f5f5f5",
            height: 80,
            animation: "pulse 1.5s infinite",
          }}
        />
      ))}
    </div>
  );
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams;

  const queryParams: RecipeQueryParams = {
    ...(params.q ? { q: params.q } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.difficulty ? { difficulty: params.difficulty as RecipeQueryParams["difficulty"] } : {}),
    ...(params.maxTime ? { maxTime: Number(params.maxTime) } : {}),
    ...(params.mainIngredient ? { mainIngredient: params.mainIngredient } : {}),
    ...(params.page ? { page: Number(params.page) } : {}),
  };

  const initialRecipes = await getRecipes(queryParams, { cache: "no-store" });

  return (
    <main>
      <Suspense fallback={<FeedSkeleton />}>
        <FeedClient initialRecipes={initialRecipes} initialParams={queryParams} />
      </Suspense>
    </main>
  );
}
