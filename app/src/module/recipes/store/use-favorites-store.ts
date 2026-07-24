import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

import { offlineCache } from '@/lib/offline-cache';
import { authService } from '@/module/auth/services/auth-service';
import { getCachedRecipeDetail, cacheRecipeDetail, evictCachedRecipeDetail } from '@/module/recipes/services/recipe-detail-cache';
import { favoritesService } from '@/module/recipes/services/favorites-service';
import { favoritesSyncService } from '@/module/recipes/services/favorites-sync-service';
import type { Recipe, RecipeDetail } from '@/module/recipes/types';

export interface FavoriteEntry {
  recipeId: string;
  slug: string;
  favoritedAt: string;
}

interface FavoritesIndex {
  favorites: Record<string, FavoriteEntry>;
  hasReconciled: boolean;
}

export interface FavoritesStore {
  favorites: Record<string, FavoriteEntry>;
  hasReconciled: boolean;
  isFavorited: (recipeId: string) => boolean;
  toggleFavorite: (recipe: RecipeDetail) => void;
  mergeFromServer: (entries: FavoriteEntry[]) => void;
}

const FAVORITES_INDEX_KEY = 'cache:favorites-index';

function loadIndex(): FavoritesIndex {
  return offlineCache.get<FavoritesIndex>(FAVORITES_INDEX_KEY) ?? { favorites: {}, hasReconciled: false };
}

function persistIndex(favorites: Record<string, FavoriteEntry>, hasReconciled: boolean): void {
  offlineCache.set<FavoritesIndex>(FAVORITES_INDEX_KEY, { favorites, hasReconciled });
}

const initialIndex = loadIndex();

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: initialIndex.favorites,
  hasReconciled: initialIndex.hasReconciled,

  isFavorited: (recipeId) => Boolean(get().favorites[recipeId]),

  toggleFavorite: (recipe) => {
    const { favorites, hasReconciled } = get();
    const wasFavorited = Boolean(favorites[recipe.id]);
    const nextFavorites = { ...favorites };
    const occurredAt = new Date().toISOString();

    if (wasFavorited) {
      delete nextFavorites[recipe.id];
      evictCachedRecipeDetail(recipe.slug);
    } else {
      nextFavorites[recipe.id] = { recipeId: recipe.id, slug: recipe.slug, favoritedAt: occurredAt };
      cacheRecipeDetail(recipe.slug, recipe);
    }

    set({ favorites: nextFavorites });
    persistIndex(nextFavorites, hasReconciled);

    if (wasFavorited) {
      favoritesSyncService.enqueueRemove(recipe.id, occurredAt);
    } else {
      favoritesSyncService.enqueueAdd(recipe.id, occurredAt);
    }
  },

  // Additive only (ADR-001 Implementation Notes): an entry already present
  // locally — including one from a toggle that just ran, possibly offline and
  // not yet acknowledged by the server — is never overwritten by this merge.
  mergeFromServer: (entries) => {
    const { favorites } = get();
    const nextFavorites = { ...favorites };
    for (const entry of entries) {
      if (!nextFavorites[entry.recipeId]) {
        nextFavorites[entry.recipeId] = entry;
      }
    }

    set({ favorites: nextFavorites, hasReconciled: true });
    persistIndex(nextFavorites, true);
  },
}));

async function reconcileWithServer(): Promise<void> {
  const session = await authService.getSession();
  if (!session) return;

  try {
    const { items } = await favoritesService.list();
    const entries: FavoriteEntry[] = items.map((item: Recipe) => ({
      recipeId: item.id,
      slug: item.slug,
      favoritedAt: new Date().toISOString(),
    }));
    useFavoritesStore.getState().mergeFromServer(entries);
  } catch {
    // Reconciliation is best-effort background work — a failed GET /favorites
    // must never block or corrupt the local-first list (ADR-001).
  }
}

// Mirrors favorites-sync-service.ts's precedent: network-status.ts only exposes
// a React hook, so a plain module needing a reconnect trigger subscribes to
// NetInfo directly. NetInfo delivers the current state immediately on
// subscribe, which doubles as the cold-start check (gated by !hasReconciled
// below); a later false->true transition is a genuine reconnect and always
// re-reconciles regardless of hasReconciled (ADR-001, Data Flow step 1).
let isConnected = true;
NetInfo.addEventListener((state) => {
  const wasConnected = isConnected;
  isConnected = Boolean(state.isConnected);
  if (!isConnected) return;

  const isReconnectEvent = !wasConnected;
  if (isReconnectEvent || !useFavoritesStore.getState().hasReconciled) {
    void reconcileWithServer();
  }
});

export interface FavoritesListResult {
  items: Recipe[];
  isEmpty: boolean;
}

// Reads exclusively from the local store and the per-slug detail cache — never
// calls favorites-service.list() (UT-012). Empty state is derived from the
// favorites map itself, not from the filtered items (UT-013), and a `removida`
// cached detail is excluded from `items` without mutating `favorites` (UT-014,
// TechSpec Data Flow step 6).
export function useFavoritesList(): FavoritesListResult {
  const favorites = useFavoritesStore((state) => state.favorites);

  const items: Recipe[] = [];
  for (const entry of Object.values(favorites)) {
    const cached = getCachedRecipeDetail(entry.slug);
    if (!cached || cached.status === 'removida') continue;
    items.push({
      id: cached.id,
      slug: cached.slug,
      title: cached.title,
      coverImageUrl: cached.coverImageUrl,
      category: cached.category,
      timeBucket: cached.timeBucket,
      difficulty: cached.difficulty,
      dietPreference: cached.dietPreference,
    });
  }

  return { items, isEmpty: Object.keys(favorites).length === 0 };
}
