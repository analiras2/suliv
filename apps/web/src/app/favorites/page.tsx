import Link from "next/link";
import type { Metadata } from "next";
import { getFavorites } from "../../lib/recipesApi";

export const metadata: Metadata = {
  title: "Favoritos · Suliv",
  description: "Suas receitas plant-based favoritas.",
};

export default async function FavoritesPage() {
  const favorites = await getFavorites({ page: 1, limit: 50 });

  return (
    <main style={styles.main}>
      <h1 style={styles.heading}>Favoritos</h1>

      {favorites.data.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <p style={styles.count}>
            {favorites.total} receita{favorites.total !== 1 ? "s" : ""} salva
            {favorites.total !== 1 ? "s" : ""}
          </p>
          <div style={styles.grid}>
            {favorites.data.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.slug}`}
                style={styles.cardLink}
              >
                <FavoriteCard recipe={recipe} />
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div style={styles.emptyWrapper}>
      <p style={styles.emptyIcon}>☆</p>
      <h2 style={styles.emptyTitle}>Nenhuma receita salva ainda</h2>
      <p style={styles.emptySubtitle}>
        Explore o feed e salve suas receitas favoritas para encontrá-las
        rapidamente aqui.
      </p>
      <Link href="/feed" style={styles.ctaButton}>
        Explorar receitas
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FavoriteCard
// ---------------------------------------------------------------------------

interface RecipeCardProps {
  recipe: {
    id: string;
    title: string;
    slug: string;
    imageUrl: string | null;
    prepTimeMin: number;
    cookTimeMin: number;
    difficulty: string;
    category: string;
  };
}

const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Médio",
  ADVANCED: "Avançado",
};

function FavoriteCard({ recipe }: RecipeCardProps) {
  const totalMin = recipe.prepTimeMin + recipe.cookTimeMin;

  return (
    <article style={styles.card}>
      {recipe.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          style={styles.cardImage}
        />
      ) : (
        <div style={styles.cardImagePlaceholder} />
      )}
      <div style={styles.cardBody}>
        <h2 style={styles.cardTitle}>{recipe.title}</h2>
        <p style={styles.cardMeta}>
          {totalMin} min ·{" "}
          {DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty} ·{" "}
          {recipe.category}
        </p>
        <span style={styles.savedBadge}>★ Salvo</span>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "2rem 1rem 4rem",
  },
  heading: {
    fontSize: 28,
    fontWeight: 700,
    color: "#1a1a1a",
    margin: "0 0 0.5rem",
  },
  count: {
    fontSize: 14,
    color: "#888",
    margin: "0 0 1.5rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
  },
  cardLink: {
    textDecoration: "none",
    color: "inherit",
    display: "block",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #f0f0f0",
  },
  cardImage: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    display: "block",
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: "#f5f5f5",
  },
  cardBody: {
    padding: "12px 16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  cardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: "#1a1a1a",
    lineHeight: "1.3",
  },
  cardMeta: {
    margin: 0,
    fontSize: 13,
    color: "#777",
  },
  savedBadge: {
    fontSize: 12,
    color: "#80BC60",
    fontWeight: 500,
  },
  emptyWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "4rem 1rem",
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    color: "#ccc",
    margin: 0,
    lineHeight: 1,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: "#333",
    margin: 0,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#888",
    margin: 0,
    maxWidth: 400,
  },
  ctaButton: {
    display: "inline-block",
    marginTop: 8,
    padding: "10px 28px",
    backgroundColor: "#80BC60",
    color: "#fff",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 15,
  },
};
