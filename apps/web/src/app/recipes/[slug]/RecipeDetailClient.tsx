"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { RecipeDetail } from "../../../lib/recipesApi";
import { useFavoriteWeb } from "./useFavoriteWeb";

interface RecipeDetailClientProps {
  recipe: RecipeDetail;
  isFavorite: boolean;
  isAuthenticated: boolean;
}

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

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m} min`;
  return `${m}:${String(s).padStart(2, "0")} min`;
}

export function RecipeDetailClient({
  recipe,
  isFavorite: initialFavorite,
  isAuthenticated,
}: RecipeDetailClientProps) {
  const pathname = usePathname();
  const [selectedServings, setSelectedServings] = useState(recipe.servings);

  const { isFavorite, toggle, isLoading: favLoading } = useFavoriteWeb(
    recipe.id,
    initialFavorite,
    isAuthenticated,
    pathname ?? `/recipes/${recipe.slug}`,
  );

  const totalMin = recipe.prepTimeMin + recipe.cookTimeMin;
  const scale = selectedServings / recipe.servings;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <article style={styles.article}>
      {/* Hero image */}
      {recipe.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          style={styles.heroImage}
        />
      )}

      {/* Title row */}
      <div style={styles.titleRow}>
        <h1 style={styles.title}>{recipe.title}</h1>
        <button
          onClick={toggle}
          disabled={favLoading}
          style={styles.favButton}
          aria-label={isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
          title={
            isAuthenticated
              ? isFavorite
                ? "Remover dos favoritos"
                : "Salvar nos favoritos"
              : "Fazer login para salvar"
          }
        >
          <span style={{ fontSize: 22, opacity: favLoading ? 0.5 : 1 }}>
            {isFavorite ? "★" : "☆"}
          </span>
          <span style={styles.favLabel}>
            {isFavorite ? "Salvo" : "Salvar"}
          </span>
        </button>
      </div>

      {/* Meta */}
      <p style={styles.meta}>
        {totalMin} min ·{" "}
        {DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty} ·{" "}
        {CATEGORY_LABELS[recipe.category] ?? recipe.category}
      </p>

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div style={styles.tags}>
          {recipe.tags.map((tag) => (
            <span key={tag} style={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      {/* Nutrition */}
      {recipe.nutritionPerServing && (
        <div style={styles.nutritionRow}>
          {(
            [
              ["Cal", recipe.nutritionPerServing.calories, ""],
              ["Prot", recipe.nutritionPerServing.proteinG, "g"],
              ["Carb", recipe.nutritionPerServing.carbsG, "g"],
              ["Gord", recipe.nutritionPerServing.fatG, "g"],
              ["Fibra", recipe.nutritionPerServing.fiberG, "g"],
            ] as [string, number, string][]
          ).map(([label, value, unit]) => (
            <div key={label} style={styles.nutritionChip}>
              <span style={styles.nutritionValue}>
                {Math.round(value * scale)}
                {unit}
              </span>
              <span style={styles.nutritionLabel}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Portion control */}
      <div style={styles.portionRow}>
        <span style={styles.portionLabel}>Porções</span>
        <div style={styles.portionControl}>
          <button
            onClick={() => setSelectedServings((v) => Math.max(1, v - 1))}
            disabled={selectedServings <= 1}
            style={styles.portionButton}
            aria-label="Diminuir porções"
          >
            −
          </button>
          <span style={styles.portionValue}>{selectedServings}</span>
          <button
            onClick={() => setSelectedServings((v) => Math.min(20, v + 1))}
            disabled={selectedServings >= 20}
            style={styles.portionButton}
            aria-label="Aumentar porções"
          >
            +
          </button>
        </div>
      </div>

      <hr style={styles.divider} />

      {/* Ingredients */}
      <section>
        <h2 style={styles.sectionTitle}>Ingredientes</h2>
        <ul style={styles.ingredientList}>
          {recipe.ingredients.map((ing) => (
            <li
              key={ing.id}
              style={{
                ...styles.ingredientItem,
                ...(ing.isAllergen && isAuthenticated
                  ? styles.allergenItem
                  : {}),
              }}
            >
              <span style={styles.quantity}>
                {formatQuantity(ing.quantity * scale)} {ing.unit}
              </span>
              <span>
                {ing.name}
                {ing.optional && (
                  <span style={styles.optional}> (opcional)</span>
                )}
                {ing.isAllergen && isAuthenticated && (
                  <span style={styles.allergenIcon} title="Contém alérgeno">
                    {" "}⚠
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <hr style={styles.divider} />

      {/* Steps */}
      <section>
        <h2 style={styles.sectionTitle}>Modo de preparo</h2>
        <ol style={styles.stepList}>
          {[...recipe.steps]
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <li key={step.id} style={styles.stepItem}>
                {step.instruction}
                {step.timerSeconds && step.timerSeconds > 0 && (
                  <span style={styles.timerBadge}>
                    ⏱ {formatTimer(step.timerSeconds)}
                  </span>
                )}
              </li>
            ))}
        </ol>
      </section>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatQuantity(value: number): string {
  const FRACTIONS: [number, string][] = [
    [0.25, "¼"],
    [0.33, "⅓"],
    [0.5, "½"],
    [0.67, "⅔"],
    [0.75, "¾"],
  ];
  const whole = Math.floor(value);
  const frac = value - whole;
  const match = FRACTIONS.find(([f]) => Math.abs(frac - f) < 0.05);
  if (match) return whole > 0 ? `${whole}${match[1]}` : match[1];
  return value % 1 === 0 ? String(value) : value.toFixed(1).replace(".", ",");
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  article: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "0 0 3rem",
  },
  heroImage: {
    width: "100%",
    height: 320,
    objectFit: "cover",
    display: "block",
  },
  titleRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "1.5rem 1.5rem 0",
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: 700,
    color: "#1a1a1a",
    margin: 0,
    lineHeight: "1.3",
  },
  favButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#80BC60",
    padding: "4px 8px",
    borderRadius: 8,
    flexShrink: 0,
  },
  favLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#80BC60",
  },
  meta: {
    margin: "0.5rem 1.5rem 0",
    fontSize: 14,
    color: "#777",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    padding: "0.75rem 1.5rem 0",
  },
  tag: {
    padding: "2px 10px",
    backgroundColor: "#80BC6015",
    borderRadius: 20,
    fontSize: 12,
    color: "#4a8030",
    fontWeight: 500,
  },
  nutritionRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    padding: "1rem 1.5rem 0",
  },
  nutritionChip: {
    flex: 1,
    minWidth: 60,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: "8px 4px",
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1a1a1a",
  },
  nutritionLabel: {
    fontSize: 11,
    color: "#888",
  },
  portionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.5rem 0",
  },
  portionLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1a1a1a",
  },
  portionControl: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  portionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid #80BC60",
    backgroundColor: "#fff",
    color: "#80BC60",
    fontSize: 18,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  portionValue: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1a1a1a",
    minWidth: 24,
    textAlign: "center",
  },
  divider: {
    border: "none",
    borderTop: "1px solid #f0f0f0",
    margin: "1.5rem",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#1a1a1a",
    margin: "0 1.5rem 1rem",
  },
  ingredientList: {
    listStyle: "none",
    padding: "0 1.5rem",
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  ingredientItem: {
    display: "flex",
    gap: 12,
    padding: "8px 0",
    borderBottom: "1px solid #f5f5f5",
    fontSize: 15,
    color: "#1a1a1a",
    alignItems: "baseline",
  },
  allergenItem: {
    color: "#c0392b",
    fontWeight: 500,
  },
  quantity: {
    minWidth: 80,
    color: "#555",
    fontSize: 14,
    flexShrink: 0,
  },
  optional: {
    color: "#999",
    fontSize: 13,
  },
  allergenIcon: {
    color: "#c0392b",
  },
  stepList: {
    padding: "0 1.5rem 0 3rem",
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  stepItem: {
    fontSize: 15,
    color: "#333",
    lineHeight: "1.65",
  },
  timerBadge: {
    display: "inline-block",
    marginLeft: 8,
    fontSize: 12,
    color: "#8A6000",
    backgroundColor: "#FFF3CD",
    padding: "2px 8px",
    borderRadius: 4,
  },
};
