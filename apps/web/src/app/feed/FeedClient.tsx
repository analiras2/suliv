"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { getRecipes } from "../../lib/recipesApi";
import type { RecipeCard } from "../../lib/recipesApi";
import type { PaginatedResponse } from "../../lib/pagination";
import type { RecipeQueryParams } from "../../lib/recipesApi";
import { FilterPanel, type FilterState, EMPTY_FILTERS } from "./FilterPanel";

interface FeedClientProps {
  initialRecipes: PaginatedResponse<RecipeCard>;
  initialParams: RecipeQueryParams;
}

// ---------------------------------------------------------------------------
// URL ↔ FilterState helpers
// ---------------------------------------------------------------------------

function paramsToFilterState(params: RecipeQueryParams): FilterState {
  return {
    q: params.q ?? "",
    category: params.category ?? "",
    difficulty: (params.difficulty as FilterState["difficulty"]) ?? "",
    maxTime: params.maxTime != null ? String(params.maxTime) : "",
    mainIngredient: params.mainIngredient ?? "",
  };
}

function filterStateToQueryString(f: FilterState, page = 1): string {
  const parts: string[] = [];
  if (f.q) parts.push(`q=${encodeURIComponent(f.q)}`);
  if (f.category) parts.push(`category=${encodeURIComponent(f.category)}`);
  if (f.difficulty) parts.push(`difficulty=${encodeURIComponent(f.difficulty)}`);
  if (f.maxTime) parts.push(`maxTime=${encodeURIComponent(f.maxTime)}`);
  if (f.mainIngredient) parts.push(`mainIngredient=${encodeURIComponent(f.mainIngredient)}`);
  if (page > 1) parts.push(`page=${page}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

function filterStateToQueryParams(f: FilterState, page = 1): RecipeQueryParams {
  return {
    ...(f.q ? { q: f.q } : {}),
    ...(f.category ? { category: f.category } : {}),
    ...(f.difficulty ? { difficulty: f.difficulty as RecipeQueryParams["difficulty"] } : {}),
    ...(f.maxTime ? { maxTime: Number(f.maxTime) } : {}),
    ...(f.mainIngredient ? { mainIngredient: f.mainIngredient } : {}),
    page,
    limit: 20,
  };
}

const SCROLL_KEY = "feed-scroll-y";

// ---------------------------------------------------------------------------
// FeedClient
// ---------------------------------------------------------------------------

export function FeedClient({ initialRecipes, initialParams }: FeedClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>(paramsToFilterState(initialParams));
  const [recipes, setRecipes] = useState<RecipeCard[]>(initialRecipes.data);
  const [hasMore, setHasMore] = useState(initialRecipes.hasMore);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ---------------------------------------------------------------------------
  // Detect desktop viewport
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ---------------------------------------------------------------------------
  // Restore scroll position on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      window.scrollTo({ top: Number(saved), behavior: "instant" });
      sessionStorage.removeItem(SCROLL_KEY);
    }
  }, []);

  // Save scroll position on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // ---------------------------------------------------------------------------
  // "/" shortcut — focus search input
  // ---------------------------------------------------------------------------

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ---------------------------------------------------------------------------
  // IntersectionObserver for infinite scroll
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isFetchingMore) {
          fetchMore();
        }
      },
      { threshold: 0.1 },
    );
    observerRef.current.observe(sentinelRef.current);

    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isFetchingMore, filters, currentPage]);

  // ---------------------------------------------------------------------------
  // Fetch more
  // ---------------------------------------------------------------------------

  const fetchMore = useCallback(async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getRecipes(filterStateToQueryParams(filters, nextPage));
      setRecipes((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    } catch {
      // silently fail — user can scroll back up
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, hasMore, currentPage, filters]);

  // ---------------------------------------------------------------------------
  // Filter change → debounced URL push + reset list
  // ---------------------------------------------------------------------------

  const applyFilters = useCallback(
    (next: FilterState) => {
      setFilters(next);
      setCurrentPage(1);
      setHasMore(true);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const qs = filterStateToQueryString(next);
        router.push(`${pathname}${qs}`, { scroll: false });
        // Re-fetch page 1
        getRecipes(filterStateToQueryParams(next, 1))
          .then((result) => {
            setRecipes(result.data);
            setHasMore(result.hasMore);
          })
          .catch(() => {});
      }, 300);
    },
    [router, pathname],
  );

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => {
      applyFilters({ ...filters, [key]: value });
    },
    [filters, applyFilters],
  );

  const handleClearFilters = useCallback(() => {
    applyFilters(EMPTY_FILTERS);
  }, [applyFilters]);

  // ---------------------------------------------------------------------------
  // Save scroll before navigating to recipe
  // ---------------------------------------------------------------------------

  const handleRecipeClick = useCallback(() => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
  }, []);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  const activeFilterCount = [
    filters.category,
    filters.difficulty,
    filters.maxTime,
    filters.mainIngredient,
  ].filter(Boolean).length;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={styles.root}>
      {/* Search bar */}
      <div style={styles.searchBar}>
        <div style={styles.searchInputWrapper}>
          <input
            ref={searchInputRef}
            type="search"
            value={filters.q}
            onChange={(e) => handleFilterChange("q", e.target.value)}
            placeholder='Buscar receitas… (pressione "/" para focar)'
            style={styles.searchInput}
            aria-label="Buscar receitas"
          />
        </div>
        {/* Mobile filter toggle */}
        {!isDesktop && (
          <button
            onClick={() => setFilterOpen((v) => !v)}
            style={{
              ...styles.filterToggle,
              ...(activeFilterCount > 0 ? styles.filterToggleActive : {}),
            }}
            aria-expanded={filterOpen}
            aria-label="Abrir filtros"
          >
            {activeFilterCount > 0 ? `Filtros (${activeFilterCount})` : "Filtros"}
          </button>
        )}
      </div>

      <div style={styles.layout}>
        {/* Sidebar (desktop always visible / mobile drawer) */}
        {(isDesktop || filterOpen) && (
          <div
            style={
              isDesktop
                ? styles.sidebar
                : { ...styles.mobileDrawer }
            }
          >
            {!isDesktop && (
              <button onClick={() => setFilterOpen(false)} style={styles.drawerClose}>
                ✕ Fechar
              </button>
            )}
            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
            />
          </div>
        )}

        {/* Mobile drawer overlay */}
        {!isDesktop && filterOpen && (
          <div
            style={styles.overlay}
            onClick={() => setFilterOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Recipe grid */}
        <main style={styles.main}>
          {recipes.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyTitle}>Nenhuma receita encontrada.</p>
              <p style={styles.emptySubtitle}>
                Tente ajustar os filtros ou a busca.
              </p>
            </div>
          ) : (
            <div style={styles.grid}>
              {recipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.slug}`}
                  onClick={handleRecipeClick}
                  style={styles.cardLink}
                >
                  <RecipeCardItem recipe={recipe} />
                </Link>
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />

          {isFetchingMore && (
            <div style={styles.loadingMore}>
              <div style={styles.spinner} />
            </div>
          )}

          {!hasMore && recipes.length > 0 && (
            <p style={styles.endMessage}>Você chegou ao fim das receitas.</p>
          )}
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecipeCardItem
// ---------------------------------------------------------------------------

function RecipeCardItem({ recipe }: { recipe: RecipeCard }) {
  const totalMin = recipe.prepTimeMin + recipe.cookTimeMin;
  const DIFFICULTY_LABELS: Record<string, string> = {
    BEGINNER: "Iniciante",
    INTERMEDIATE: "Médio",
    ADVANCED: "Avançado",
  };

  return (
    <article style={cardStyles.card}>
      {recipe.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          style={cardStyles.image}
          loading="lazy"
        />
      )}
      {!recipe.imageUrl && <div style={cardStyles.imagePlaceholder} />}
      <div style={cardStyles.body}>
        <h2 style={cardStyles.title}>{recipe.title}</h2>
        <p style={cardStyles.meta}>
          {totalMin} min · {DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty} ·{" "}
          {recipe.category}
        </p>
        {recipe.isFavorite && (
          <span style={cardStyles.favBadge}>★ Salvo</span>
        )}
      </div>
    </article>
  );
}

const cardStyles = {
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden" as const,
    border: "1px solid #f0f0f0",
    transition: "box-shadow 0.15s",
  },
  image: {
    width: "100%",
    height: 180,
    objectFit: "cover" as const,
    display: "block" as const,
  },
  imagePlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: "#f5f5f5",
  },
  body: {
    padding: "12px 16px 16px",
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 4,
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600 as const,
    color: "#1a1a1a",
    lineHeight: "1.3",
  },
  meta: {
    margin: 0,
    fontSize: 13,
    color: "#777",
  },
  favBadge: {
    fontSize: 12,
    color: "#80BC60",
    fontWeight: 500 as const,
  },
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  root: {
    minHeight: "100vh",
    backgroundColor: "#fafafa",
  },
  searchBar: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 12,
    padding: "12px 16px",
    backgroundColor: "#fff",
    borderBottom: "1px solid #f0f0f0",
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
  },
  searchInputWrapper: {
    flex: 1,
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "8px 14px",
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    fontSize: 14,
    color: "#1a1a1a",
    backgroundColor: "#fafafa",
    outline: "none",
  },
  filterToggle: {
    padding: "8px 16px",
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#444",
    cursor: "pointer" as const,
    whiteSpace: "nowrap" as const,
  },
  filterToggleActive: {
    borderColor: "#80BC60",
    color: "#4a8030",
    backgroundColor: "#80BC6015",
  },
  layout: {
    display: "flex" as const,
    maxWidth: 1100,
    margin: "0 auto",
    padding: "24px 16px",
    gap: 24,
    alignItems: "flex-start" as const,
    position: "relative" as const,
  },
  sidebar: {
    width: 240,
    flexShrink: 0,
    position: "sticky" as const,
    top: 72,
  },
  mobileDrawer: {
    position: "fixed" as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: "16px 16px 0 0",
    padding: "16px",
    zIndex: 20,
    maxHeight: "80vh",
    overflowY: "auto" as const,
    boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
  },
  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 19,
  },
  drawerClose: {
    background: "none",
    border: "none",
    cursor: "pointer" as const,
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    padding: 0,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  grid: {
    display: "grid" as const,
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
  },
  cardLink: {
    textDecoration: "none",
    color: "inherit",
    display: "block" as const,
  },
  empty: {
    textAlign: "center" as const,
    padding: "48px 0",
  },
  emptyTitle: {
    margin: "0 0 8px",
    fontSize: 18,
    fontWeight: 600 as const,
    color: "#333",
  },
  emptySubtitle: {
    margin: 0,
    fontSize: 14,
    color: "#888",
  },
  loadingMore: {
    display: "flex" as const,
    justifyContent: "center" as const,
    padding: "24px 0",
  },
  spinner: {
    width: 24,
    height: 24,
    border: "3px solid #e0e0e0",
    borderTop: "3px solid #80BC60",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  endMessage: {
    textAlign: "center" as const,
    padding: "24px 0",
    fontSize: 13,
    color: "#aaa",
    margin: 0,
  },
};
