"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getRecipes } from "../../lib/recipesApi";
import type { RecipeCard } from "../../lib/recipesApi";
import type { PaginatedResponse } from "../../lib/pagination";
import type { RecipeQueryParams } from "../../lib/recipesApi";
import { FilterPanel, type FilterState, EMPTY_FILTERS, CATEGORY_OPTIONS } from "./FilterPanel";
import { TopNav, type FeedTab } from "./TopNav";

// ─── Palette ──────────────────────────────────────────────────────────────────
const O = {
  sand25: "#FDFBF6", sand100: "#F3ECDD", sand200: "#E9DFC8",
  moss100: "#E1EBD6", moss500: "#4C7438", moss600: "#3B5B2C", moss700: "#2D4522",
  ink100: "#EAE5D9", ink200: "#D4CCBB", ink300: "#B0A697",
  ink500: "#6F675C", ink700: "#3A362F", ink900: "#15130F",
  white: "#FFFFFF",
};

interface FeedClientProps {
  initialRecipes: PaginatedResponse<RecipeCard>;
  initialParams: RecipeQueryParams;
}

// ─── URL helpers ──────────────────────────────────────────────────────────────
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

// ─── SectionHeader ────────────────────────────────────────────────────────────
function SectionHeader({ kicker, title, action, onAction }: {
  kicker: string; title: string; action?: string; onAction?: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 20px 10px" }}>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: O.moss600, marginBottom: 2 }}>
          {kicker}
        </div>
        <div style={{ fontFamily: 'var(--font-display, "Fraunces", Georgia, serif)', fontSize: 24, lineHeight: 1.1, color: O.ink900, letterSpacing: "-0.016em", fontWeight: 500 }}>
          {title}
        </div>
      </div>
      {action && onAction && (
        <button
          onClick={onAction}
          style={{ background: "none", border: "none", fontSize: 13, color: O.moss700, fontWeight: 600, cursor: "pointer", padding: "4px 0", fontFamily: "inherit" }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

// ─── CategoriesRow ────────────────────────────────────────────────────────────
function CategoriesRow({ active, onSelect }: { active: string; onSelect: (v: string) => void }) {
  return (
    <div style={{ overflowX: "auto", scrollbarWidth: "none" }}>
      <div style={{ display: "flex", gap: 8, padding: "0 20px 4px", width: "max-content" }}>
        {CATEGORY_OPTIONS.map((cat) => {
          const isActive = active === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => onSelect(isActive ? "" : cat.value)}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                background: isActive ? O.moss500 : O.sand100,
                border: `1.5px solid ${isActive ? O.moss500 : O.ink200}`,
                color: isActive ? O.sand25 : O.ink700,
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                cursor: "pointer", fontFamily: "inherit",
                whiteSpace: "nowrap",
                transition: "all 150ms",
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── FeedClient ───────────────────────────────────────────────────────────────
export function FeedClient({ initialRecipes, initialParams }: FeedClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState<FeedTab>("feed");
  const [filters, setFilters] = useState<FilterState>(paramsToFilterState(initialParams));
  const [recipes, setRecipes] = useState<RecipeCard[]>(initialRecipes.data);
  const [hasMore, setHasMore] = useState(initialRecipes.hasMore);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Restore scroll position
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      window.scrollTo({ top: Number(saved), behavior: "instant" });
      sessionStorage.removeItem(SCROLL_KEY);
    }
  }, []);

  useEffect(() => {
    const handler = () => sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // "/" shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        setActiveTab("search");
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting && hasMore && !isFetchingMore) fetchMore(); },
      { threshold: 0.1 },
    );
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isFetchingMore, filters, currentPage]);

  const fetchMore = useCallback(async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getRecipes(filterStateToQueryParams(filters, nextPage));
      setRecipes((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    } catch { /* ignore */ }
    finally { setIsFetchingMore(false); }
  }, [isFetchingMore, hasMore, currentPage, filters]);

  const applyFilters = useCallback((next: FilterState) => {
    setFilters(next);
    setCurrentPage(1);
    setHasMore(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const qs = filterStateToQueryString(next);
      router.push(`${pathname}${qs}`, { scroll: false });
      getRecipes(filterStateToQueryParams(next, 1))
        .then((result) => { setRecipes(result.data); setHasMore(result.hasMore); })
        .catch(() => {});
    }, 300);
  }, [router, pathname]);

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => applyFilters({ ...filters, [key]: value }),
    [filters, applyFilters],
  );

  const handleClearFilters = useCallback(() => applyFilters(EMPTY_FILTERS), [applyFilters]);
  const handleRecipeClick = useCallback(() => sessionStorage.setItem(SCROLL_KEY, String(window.scrollY)), []);

  const activeFilterCount = [filters.category, filters.difficulty, filters.maxTime, filters.mainIngredient].filter(Boolean).length;

  // ─── Recipe grid (shared) ─────────────────────────────────────────────────
  const recipeGrid = (
    <>
      {recipes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: O.ink700 }}>Nenhuma receita encontrada.</p>
          <p style={{ margin: 0, fontSize: 14, color: O.ink300 }}>Tente ajustar os filtros ou a busca.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, padding: "0 20px" }}>
          {recipes.map((recipe) => (
            <Link key={recipe.id} href={`/recipes/${recipe.slug}`} onClick={handleRecipeClick} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <RecipeCardItem recipe={recipe} />
            </Link>
          ))}
        </div>
      )}
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
      {isFetchingMore && (
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
          <div style={{ width: 24, height: 24, border: `3px solid ${O.ink200}`, borderTop: `3px solid ${O.moss500}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}
      {!hasMore && recipes.length > 0 && (
        <p style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: O.ink300, margin: 0 }}>Você chegou ao fim das receitas.</p>
      )}
    </>
  );

  // ─── Feed tab ─────────────────────────────────────────────────────────────
  const feedContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingTop: 24, paddingBottom: 32 }}>
      <div>
        <SectionHeader kicker="Explorar" title="Categorias" />
        <CategoriesRow active={filters.category} onSelect={(v) => handleFilterChange("category", v)} />
      </div>
      <div>
        <SectionHeader kicker="Comunidade" title="Top da semana" action={activeFilterCount > 0 ? "Limpar filtros" : undefined} onAction={handleClearFilters} />
        {recipeGrid}
      </div>
    </div>
  );

  // ─── Search tab ───────────────────────────────────────────────────────────
  const searchContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingTop: 16 }}>
      {/* Search bar */}
      <div style={{ padding: "0 20px 16px", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <input
            ref={searchInputRef}
            type="search"
            value={filters.q}
            onChange={(e) => handleFilterChange("q", e.target.value)}
            placeholder='Buscar receitas… (pressione "/" para focar)'
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 16px",
              border: `1.5px solid ${O.ink200}`,
              borderRadius: 14, fontSize: 15,
              color: O.ink900, backgroundColor: O.white,
              outline: "none", fontFamily: "inherit",
            }}
            aria-label="Buscar receitas"
          />
        </div>
        <button
          onClick={() => setFilterOpen((v) => !v)}
          style={{
            padding: "10px 16px",
            border: `1.5px solid ${activeFilterCount > 0 ? O.moss500 : O.ink200}`,
            borderRadius: 14,
            background: activeFilterCount > 0 ? O.moss100 : O.white,
            fontSize: 14, color: activeFilterCount > 0 ? O.moss700 : O.ink500,
            cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", fontWeight: 500,
          }}
        >
          {activeFilterCount > 0 ? `Filtros (${activeFilterCount})` : "Filtros"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 24, padding: "0 20px", alignItems: "flex-start" }}>
        {filterOpen && (
          <div style={{ width: 220, flexShrink: 0, position: "sticky", top: 76 }}>
            <FilterPanel filters={filters} onChange={handleFilterChange} onClear={handleClearFilters} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {recipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipes/${recipe.slug}`} onClick={handleRecipeClick} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                <RecipeCardItem recipe={recipe} />
              </Link>
            ))}
          </div>
          {recipes.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: O.ink700 }}>Nenhuma receita encontrada.</p>
              <p style={{ margin: 0, fontSize: 14, color: O.ink300 }}>Tente ajustar os filtros ou a busca.</p>
            </div>
          )}
          <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
          {isFetchingMore && (
            <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
              <div style={{ width: 24, height: 24, border: `3px solid ${O.ink200}`, borderTop: `3px solid ${O.moss500}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ─── Placeholder tab ──────────────────────────────────────────────────────
  const placeholderContent = (label: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 12 }}>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: O.ink700 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 14, color: O.ink300 }}>Em breve.</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: O.sand100, fontFamily: 'var(--font-sans, "Inter Tight", system-ui)' }}>
      <TopNav activeTab={activeTab} onTabChange={setActiveTab} />
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {activeTab === "feed"      && feedContent}
        {activeTab === "search"    && searchContent}
        {activeTab === "favorites" && placeholderContent("Favoritos")}
        {activeTab === "profile"   && placeholderContent("Perfil")}
      </div>
    </div>
  );
}

// ─── RecipeCardItem ───────────────────────────────────────────────────────────
function RecipeCardItem({ recipe }: { recipe: RecipeCard }) {
  const totalMin = recipe.prepTimeMin + recipe.cookTimeMin;
  const DIFFICULTY_LABELS: Record<string, string> = {
    BEGINNER: "Iniciante", INTERMEDIATE: "Médio", ADVANCED: "Avançado",
  };

  return (
    <article style={{
      backgroundColor: O.white, borderRadius: 16, overflow: "hidden",
      border: `1px solid ${O.ink100}`,
      boxShadow: "0 1px 3px rgba(58,54,47,0.06)",
      transition: "box-shadow 0.15s",
    }}>
      {recipe.imageUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={recipe.imageUrl} alt={recipe.title} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} loading="lazy" />
        : <div style={{ width: "100%", height: 180, backgroundColor: O.sand200 }} />
      }
      <div style={{ padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
        <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 600, color: O.ink900, lineHeight: 1.3 }}>{recipe.title}</h2>
        <p style={{ margin: 0, fontSize: 12.5, color: O.ink500 }}>
          {totalMin} min · {DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty} · {recipe.category}
        </p>
        {recipe.isFavorite && <span style={{ fontSize: 12, color: O.moss700, fontWeight: 500 }}>★ Salvo</span>}
      </div>
    </article>
  );
}
