"use client";

// TW05 — implemented in the next phase (RecipeDetailClient + useFavoriteWeb)
// This stub allows TW03 (RecipeDetailPage SSR) to compile and render recipe data.

import type { RecipeDetail } from "../../../lib/recipesApi";

interface RecipeDetailClientProps {
  recipe: RecipeDetail;
  isFavorite: boolean;
  isAuthenticated: boolean;
}

export function RecipeDetailClient({ recipe, isFavorite, isAuthenticated }: RecipeDetailClientProps) {
  return (
    <article style={{ maxWidth: 720, margin: "0 auto", padding: "1.5rem" }}>
      {recipe.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 12 }}
        />
      )}
      <h1 style={{ fontSize: 28, margin: "1rem 0 0.25rem" }}>{recipe.title}</h1>
      <p style={{ color: "#666", fontSize: 14, margin: "0 0 1.5rem" }}>
        {recipe.prepTimeMin + recipe.cookTimeMin} min · {recipe.difficulty} · {recipe.servings} porções
        {isAuthenticated && (
          <span style={{ marginLeft: 12, color: "#80BC60" }}>
            {isFavorite ? "★ Salvo" : "☆ Salvar"}
          </span>
        )}
      </p>

      <section>
        <h2 style={{ fontSize: 20, marginBottom: "0.75rem" }}>Ingredientes</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {recipe.ingredients.map((ing) => (
            <li
              key={ing.id}
              style={{
                padding: "6px 0",
                borderBottom: "1px solid #f0f0f0",
                color: ing.isAllergen && isAuthenticated ? "#D94F4F" : "inherit",
                fontWeight: ing.isAllergen && isAuthenticated ? 500 : 400,
              }}
            >
              {ing.quantity} {ing.unit} {ing.name}
              {ing.optional && <span style={{ color: "#999" }}> (opcional)</span>}
              {ing.isAllergen && isAuthenticated && <span title="Contém alérgeno"> ⚠</span>}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: 20, marginBottom: "0.75rem" }}>Modo de preparo</h2>
        <ol style={{ paddingLeft: "1.5rem", margin: 0 }}>
          {recipe.steps
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <li key={step.id} style={{ marginBottom: "0.75rem", lineHeight: 1.6 }}>
                {step.instruction}
                {step.timerSeconds && step.timerSeconds > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 13, color: "#8A6000", background: "#FFF3CD", padding: "2px 6px", borderRadius: 4 }}>
                    ⏱ {Math.floor(step.timerSeconds / 60)} min
                  </span>
                )}
              </li>
            ))}
        </ol>
      </section>
    </article>
  );
}
