"use client";

// TW04 — implemented in the next phase (FeedClient + FilterPanel)
// This stub allows TW02 (FeedPage SSR) to compile and render the initial data.

import type { RecipeCard } from "../../lib/recipesApi";
import type { PaginatedResponse } from "../../lib/pagination";
import type { RecipeQueryParams } from "../../lib/recipesApi";

interface FeedClientProps {
  initialRecipes: PaginatedResponse<RecipeCard>;
  initialParams: RecipeQueryParams;
}

export function FeedClient({ initialRecipes }: FeedClientProps) {
  return (
    <div style={{ padding: "1rem" }}>
      {initialRecipes.data.map((r) => (
        <div key={r.id} style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #eee", borderRadius: 8 }}>
          <strong>{r.title}</strong>
          <p style={{ margin: "4px 0", fontSize: 14, color: "#666" }}>
            {r.prepTimeMin + r.cookTimeMin} min · {r.difficulty} · {r.category}
          </p>
        </div>
      ))}
      {initialRecipes.data.length === 0 && (
        <p style={{ color: "#999" }}>Nenhuma receita encontrada.</p>
      )}
    </div>
  );
}
