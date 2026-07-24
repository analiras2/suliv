import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { useSessionStore } from '@/module/auth/store/use-session-store';
import {
  recipeAuthoringService,
  type DeletePreview,
  type RecipeAuthoringService,
} from '@/module/recipe-authoring/services/recipe-authoring-service';
import { useRecipeDraftsStore } from '@/module/recipe-authoring/store/use-recipe-drafts-store';
import type { MyRecipeStatus, MyRecipeSummary } from '@/module/recipe-authoring/types';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TOO_MANY_UNSENT_DRAFTS_THRESHOLD = 10; // §14.3: "acima de 10" — boundary is strictly-greater-than

export type MyRecipesGroups = Record<MyRecipeStatus, MyRecipeSummary[]>;

export interface UseMyRecipesViewModel {
  groups: MyRecipesGroups;
  isEmpty: boolean;
  isLoading: boolean;
  error: string | null;
  hasTooManyUnsentDrafts: boolean;
  staleDraftIds: string[];
  requestDelete: (recipeId: string) => Promise<DeletePreview | void>;
  confirmDelete: (recipeId: string) => Promise<void>;
  refetch: () => void;
}

function emptyGroups(): MyRecipesGroups {
  return { rascunho: [], em_analise: [], aprovada: [], precisa_de_ajustes: [] };
}

export function useMyRecipesViewModel(
  authoring: RecipeAuthoringService = recipeAuthoringService,
): UseMyRecipesViewModel {
  const session = useSessionStore((state) => state.session);
  const queryClient = useQueryClient();
  const drafts = useRecipeDraftsStore((state) => state.drafts);

  const query = useQuery({
    queryKey: ['my-recipes', session?.user.id],
    queryFn: () => authoring.listMine(),
    enabled: Boolean(session),
  });

  // UT-015: groups every fetched recipe by its status, across all four.
  const groups = useMemo(() => {
    const next = emptyGroups();
    for (const item of query.data?.items ?? []) {
      next[item.status].push(item);
    }
    return next;
  }, [query.data]);

  // UT-016: the empty state reflects the fetched list itself, not local drafts.
  const isEmpty = !query.isLoading && (query.data?.items.length ?? 0) === 0;

  // UT-017: computed client-side from the local drafts store — a draft that
  // has never confirmed a sync (lastSyncedAt === null) counts as "unsent".
  // No server round trip needed to display this warning (ADR-003).
  const unsentDraftsCount = useMemo(
    () => Object.values(drafts).filter((draft) => draft.lastSyncedAt === null).length,
    [drafts],
  );
  const hasTooManyUnsentDrafts = unsentDraftsCount > TOO_MANY_UNSENT_DRAFTS_THRESHOLD;

  // UT-018: a draft's reference time is lastSyncedAt once confirmed synced,
  // or its own createdAt while it has never synced. Strictly more than 7
  // days old — exactly 7 days does not trigger the warning. Date.now() is
  // impure, so it's read in an effect (post-render), never in the render body.
  const [staleDraftIds, setStaleDraftIds] = useState<string[]>([]);
  useEffect(() => {
    const now = Date.now();
    // Wall-clock staleness can't be derived during render (Date.now() is
    // impure); syncing it via an effect is the deliberate exception here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStaleDraftIds(
      Object.values(drafts)
        .filter((draft) => {
          const referenceTime = new Date(draft.lastSyncedAt ?? draft.createdAt).getTime();
          return now - referenceTime > SEVEN_DAYS_MS;
        })
        .map((draft) => draft.id),
    );
  }, [drafts]);

  const requestDelete = async (recipeId: string): Promise<DeletePreview | void> => {
    return authoring.delete(recipeId, false);
  };

  const confirmDelete = async (recipeId: string): Promise<void> => {
    await authoring.delete(recipeId, true);
    await queryClient.invalidateQueries({ queryKey: ['my-recipes', session?.user.id] });
  };

  const refetch = () => {
    void query.refetch();
  };

  return {
    groups,
    isEmpty,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    hasTooManyUnsentDrafts,
    staleDraftIds,
    requestDelete,
    confirmDelete,
    refetch,
  };
}
